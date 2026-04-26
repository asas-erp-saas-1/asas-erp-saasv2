// src/core/learningEngineV2.ts
// Causal + Statistical Learning Engine
// Logistic regression with gradient descent + L2 regularization
// Platt Scaling / Isotonic Regression calibration
// Simplified causal inference: propensity scoring + matched pair comparison

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Logger } from '@/lib/observability'
import type { EventBusInstance } from '@/core/eventBus'
import { createConsoleLogger } from '@/core/eventBus'
import { EVENT_TYPES } from '@/types/events'

// =============================================================================
// TYPES
// =============================================================================

export type CalibrationMethod = 'platt' | 'isotonic' | 'auto' | 'none'
export type CausalConfidence  = 'high' | 'estimated' | 'correlation_only'

export interface FeatureVector {
  dealValueNormalized:     number   // 0–1
  timeToCloseNormalized:   number   // 0–1
  decisionScore:           number   // 0–1
  agentScore:              number   // 0–1
  stageTransitionRate:     number   // 0–1
  failureRate:             number   // 0–1
  inactivityDuration:      number   // 0–1 (normalized days)
  dealAge:                 number   // 0–1 (normalized days)
  difficultyScore:         number   // 0–1
  effortScore:             number   // 0–1
  propertyTypeEncoded:     number   // one-hot reduced
  projectStageEncoded:     number   // ordinal
  developerScoreEncoded:   number   // ordinal
  financingAvailable:      number   // 0 or 1
  legalStatusEncoded:      number   // ordinal
}

export interface TrainingObservation {
  features:          FeatureVector
  outcome:           1 | 0          // 1 = closed/won, 0 = lost/cancelled
  weight:            number         // dataTrustScore × sourceReliabilityMultiplier
  dealId:            string
}

export interface PlattCalibration {
  A: number    // scale
  B: number    // bias
}

export interface IsotonicBin {
  xMin:   number
  xMax:   number
  yValue: number  // calibrated probability for this bin
}

export interface MLModelWeights {
  contextKey:         string
  weights:            number[]   // feature weights
  bias:               number
  calibrationMethod:  CalibrationMethod
  platt?:             PlattCalibration
  isotonicBins?:      IsotonicBin[]
  sampleSize:         number
  trainLoss:          number
  valAccuracy:        number
  regularization:     number
  trainedAt:          string
  version:            string
}

export interface CausalEffect {
  actionType:         string
  causalEffect:       number           // P(close|treatment) - P(close|control)
  causalConfidence:   CausalConfidence
  treatmentSamples:   number
  controlSamples:     number
  propensityScores:   number[]
}

// =============================================================================
// LEARNING ENGINE V2 CONFIG
// =============================================================================

export interface LearningEngineV2Config {
  // Gradient descent
  learningRate:             number
  batchSize:                number
  epochs:                   number
  regularizationStrength:   number  // L2 lambda
  // Calibration
  calibrationMethod:        CalibrationMethod
  calibrationThreshold:     number  // sample size above which isotonic used
  // Model governance
  minSampleSize:            number
  confidenceThreshold:      number
  modelHealthThreshold:     number
  stabilityFactor:          number
  decayHalfLifeDays:        number
  // Causal
  causalConfidenceThreshold: number
  propensityMatchingK:       number  // K nearest neighbors
  // Drift
  driftThresholdPct:         number
}

export const DEFAULT_LR_CONFIG: LearningEngineV2Config = {
  learningRate:              0.05,
  batchSize:                 32,
  epochs:                    100,
  regularizationStrength:    0.01,
  calibrationMethod:         'auto',
  calibrationThreshold:      1000,
  minSampleSize:             10,
  confidenceThreshold:       0.30,
  modelHealthThreshold:      40,
  stabilityFactor:           0.92,
  decayHalfLifeDays:         30,
  causalConfidenceThreshold: 0.70,
  propensityMatchingK:       5,
  driftThresholdPct:         20,
}

const FEATURE_COUNT = 15  // matches FeatureVector fields

// =============================================================================
// PURE MATH FUNCTIONS (no I/O, fully deterministic, testable)
// =============================================================================

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

function dotProduct(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] ?? 0) * (b[i] ?? 0)
  }
  return sum
}

function predict(features: number[], weights: number[], bias: number): number {
  return sigmoid(dotProduct(features, weights) + bias)
}

function crossEntropyLoss(
  predictions: number[],
  labels:      number[],
  weights:     number[],
  lambda:      number,
): number {
  const n = predictions.length
  let loss = 0
  for (let i = 0; i < n; i++) {
    const p = Math.max(1e-10, Math.min(1 - 1e-10, predictions[i]!))
    loss -= (labels[i]! * Math.log(p) + (1 - labels[i]!) * Math.log(1 - p))
  }
  // L2 regularization term
  const l2 = (lambda / 2) * weights.reduce((s, w) => s + w * w, 0)
  return loss / n + l2
}

function featureVectorToArray(f: FeatureVector): number[] {
  return [
    f.dealValueNormalized,
    f.timeToCloseNormalized,
    f.decisionScore,
    f.agentScore,
    f.stageTransitionRate,
    f.failureRate,
    f.inactivityDuration,
    f.dealAge,
    f.difficultyScore,
    f.effortScore,
    f.propertyTypeEncoded,
    f.projectStageEncoded,
    f.developerScoreEncoded,
    f.financingAvailable,
    f.legalStatusEncoded,
  ]
}

// =============================================================================
// GRADIENT DESCENT TRAINING (mini-batch with L2 regularization)
// =============================================================================

export interface TrainResult {
  weights:      number[]
  bias:         number
  finalLoss:    number
  valAccuracy:  number
  epochs:       number
  converged:    boolean
}

export function trainLogisticRegression(
  observations: TrainingObservation[],
  config: LearningEngineV2Config,
  initialWeights?: number[],
  initialBias?: number,
): TrainResult {
  if (observations.length < config.minSampleSize) {
    throw new Error(`Insufficient samples: ${observations.length} < ${config.minSampleSize}`)
  }

  let W = initialWeights ?? new Array(FEATURE_COUNT).fill(0).map(() => (Math.random() - 0.5) * 0.01)
  let b = initialBias ?? 0
  const { learningRate: lr, batchSize, epochs, regularizationStrength: lambda } = config

  // 80/20 train/val split
  const trainSize = Math.floor(observations.length * 0.8)
  const trainObs  = observations.slice(0, trainSize)
  const valObs    = observations.slice(trainSize)

  let prevLoss    = Infinity
  let converged   = false
  let finalLoss   = Infinity

  for (let epoch = 0; epoch < epochs; epoch++) {
    // Shuffle training data
    const shuffled = [...trainObs].sort(() => Math.random() - 0.5)

    // Mini-batch gradient descent
    for (let start = 0; start < shuffled.length; start += batchSize) {
      const batch = shuffled.slice(start, start + batchSize)
      const n     = batch.length

      const gradW = new Array(FEATURE_COUNT).fill(0)
      let gradB   = 0

      for (const obs of batch) {
        const xArr = featureVectorToArray(obs.features)
        const p    = predict(xArr, W, b)
        const err  = (p - obs.outcome) * obs.weight

        for (let j = 0; j < FEATURE_COUNT; j++) {
          gradW[j] += err * (xArr[j] ?? 0)
        }
        gradB += err
      }

      // Update weights with L2 regularization
      for (let j = 0; j < FEATURE_COUNT; j++) {
        W[j] = (W[j] ?? 0) * (1 - lr * lambda) - lr * (gradW[j]! / n)
      }
      b -= lr * (gradB / n)
    }

    // Compute train loss for convergence check
    const predictions = trainObs.map((o) => predict(featureVectorToArray(o.features), W, b))
    const labels      = trainObs.map((o) => o.outcome)
    finalLoss = crossEntropyLoss(predictions, labels, W, lambda)

    if (Math.abs(prevLoss - finalLoss) < 1e-6) {
      converged = true
      break
    }
    prevLoss = finalLoss
  }

  // Validation accuracy
  let correct = 0
  for (const obs of valObs) {
    const p = predict(featureVectorToArray(obs.features), W, b)
    if ((p >= 0.5 ? 1 : 0) === obs.outcome) correct++
  }
  const valAccuracy = valObs.length > 0 ? correct / valObs.length : 0

  return { weights: W, bias: b, finalLoss, valAccuracy, epochs, converged }
}

// =============================================================================
// PLATT SCALING CALIBRATION
// Use when sampleSize < calibrationThreshold
// Fits a secondary sigmoid on (raw_score → actual_outcome)
// =============================================================================

export function fitPlattScaling(
  rawScores: number[],
  outcomes:  number[],
): PlattCalibration {
  if (rawScores.length !== outcomes.length) {
    throw new Error('Platt: rawScores and outcomes must have same length')
  }

  // Target smoothed labels (Platt 2000 method)
  const n    = rawScores.length
  const nPos = outcomes.filter((o) => o === 1).length
  const nNeg = n - nPos
  const tPos = (nPos + 1) / (nPos + 2)   // smoothed positive label
  const tNeg = 1 / (nNeg + 2)             // smoothed negative label

  const targets = outcomes.map((o) => (o === 1 ? tPos : tNeg))

  // Gradient descent to fit A, B
  let A = 0
  let B = Math.log((nNeg + 1) / (nPos + 1))
  const lr = 0.01
  const maxIter = 200

  for (let iter = 0; iter < maxIter; iter++) {
    let dA = 0
    let dB = 0
    let loss = 0

    for (let i = 0; i < n; i++) {
      const fval = A * rawScores[i]! + B
      const p    = Math.max(1e-10, Math.min(1 - 1e-10, sigmoid(fval))  )
      const t    = targets[i]!
      loss -= t * Math.log(p) + (1 - t) * Math.log(1 - p)
      const diff = p - t
      dA += rawScores[i]! * diff
      dB += diff
    }

    A -= lr * dA / n
    B -= lr * dB / n

    if (iter > 10 && Math.abs(dA) < 1e-5 && Math.abs(dB) < 1e-5) break
  }

  return { A, B }
}

export function applyPlattScaling(rawScore: number, calibration: PlattCalibration): number {
  return sigmoid(calibration.A * rawScore + calibration.B)
}

// =============================================================================
// ISOTONIC REGRESSION (simplified — piecewise constant monotone fit)
// Use when sampleSize >= calibrationThreshold
// =============================================================================

export function fitIsotonicRegression(
  rawScores: number[],
  outcomes:  number[],
  nBins = 20,
): IsotonicBin[] {
  if (rawScores.length !== outcomes.length) {
    throw new Error('Isotonic: rawScores and outcomes must have same length')
  }

  // Bin raw scores
  const minScore = Math.min(...rawScores)
  const maxScore = Math.max(...rawScores)
  const binWidth = (maxScore - minScore) / nBins || 1

  const bins: Array<{ sum: number; count: number }> = Array.from({ length: nBins }, () => ({ sum: 0, count: 0 }))

  for (let i = 0; i < rawScores.length; i++) {
    const binIdx = Math.min(nBins - 1, Math.floor((rawScores[i]! - minScore) / binWidth))
    bins[binIdx]!.sum   += outcomes[i]!
    bins[binIdx]!.count += 1
  }

  // Initial bin means
  const means = bins.map((b) => b.count > 0 ? b.sum / b.count : 0)

  // Pool adjacent violators (enforce monotonicity)
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < means.length - 1; i++) {
      if (means[i]! > means[i + 1]!) {
        // Merge bins i and i+1
        const merged = (bins[i]!.sum + bins[i + 1]!.sum) / (bins[i]!.count + bins[i + 1]!.count)
        means[i]     = merged
        means[i + 1] = merged
        bins[i]!.sum   += bins[i + 1]!.sum
        bins[i]!.count += bins[i + 1]!.count
        changed = true
      }
    }
  }

  return means.map((yValue, idx) => ({
    xMin:   minScore + idx * binWidth,
    xMax:   minScore + (idx + 1) * binWidth,
    yValue: yValue,
  }))
}

export function applyIsotonicRegression(rawScore: number, bins: IsotonicBin[]): number {
  if (bins.length === 0) return rawScore

  for (const bin of bins) {
    if (rawScore >= bin.xMin && rawScore < bin.xMax) {
      return bin.yValue
    }
  }
  // Extrapolate
  return rawScore <= bins[0]!.xMin
    ? bins[0]!.yValue
    : bins[bins.length - 1]!.yValue
}

// =============================================================================
// CALIBRATED PREDICTION
// =============================================================================

export function calibratedPredict(
  features:     number[],
  model:        MLModelWeights,
): number {
  const rawScore = predict(features, model.weights, model.bias)

  if (model.calibrationMethod === 'none') return rawScore

  if (model.calibrationMethod === 'platt' && model.platt) {
    return applyPlattScaling(rawScore, model.platt)
  }

  if (model.calibrationMethod === 'isotonic' && model.isotonicBins?.length) {
    return applyIsotonicRegression(rawScore, model.isotonicBins)
  }

  return rawScore
}

// =============================================================================
// CAUSAL INFERENCE — propensity scoring + matched pair comparison
// =============================================================================

export interface PropensityMatch {
  treatmentId:      string
  controlId:        string | null
  propensityScore:  number
  matchSimilarity:  number
  treatmentOutcome: boolean
  controlOutcome:   boolean | null
  causalEffect:     number
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot    = a.reduce((s, ai, i) => s + ai * (b[i] ?? 0), 0)
  const magA   = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0))
  const magB   = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0))
  if (magA === 0 || magB === 0) return 0
  return dot / (magA * magB)
}

export function computePropensityScores(
  observations: TrainingObservation[],
  model:        MLModelWeights,
): Map<string, number> {
  const scores = new Map<string, number>()
  for (const obs of observations) {
    const features = featureVectorToArray(obs.features)
    scores.set(obs.dealId, calibratedPredict(features, model))
  }
  return scores
}

export function matchTreatmentControlPairs(
  treatmentObs:    TrainingObservation[],
  controlObs:      TrainingObservation[],
  propensityScores: Map<string, number>,
  k = 5,
): PropensityMatch[] {
  const matches: PropensityMatch[] = []

  for (const treatment of treatmentObs) {
    const tScore    = propensityScores.get(treatment.dealId) ?? 0
    const tFeatures = featureVectorToArray(treatment.features)

    // Find K nearest controls by propensity score
    const ranked = controlObs
      .map((ctrl) => {
        const cScore    = propensityScores.get(ctrl.dealId) ?? 0
        const cFeatures = featureVectorToArray(ctrl.features)
        return {
          ctrl,
          propensityDiff: Math.abs(tScore - cScore),
          featureSim:     cosineSimilarity(tFeatures, cFeatures),
        }
      })
      .sort((a, b) => a.propensityDiff - b.propensityDiff)
      .slice(0, k)

    // Best match
    const best = ranked[0]

    if (!best) {
      matches.push({
        treatmentId:      treatment.dealId,
        controlId:        null,
        propensityScore:  tScore,
        matchSimilarity:  0,
        treatmentOutcome: treatment.outcome === 1,
        controlOutcome:   null,
        causalEffect:     0,
      })
      continue
    }

    const treatmentOutcome = treatment.outcome === 1
    const controlOutcome   = best.ctrl.outcome === 1
    const causalEffect     = (treatmentOutcome ? 1 : 0) - (controlOutcome ? 1 : 0)

    matches.push({
      treatmentId:      treatment.dealId,
      controlId:        best.ctrl.dealId,
      propensityScore:  tScore,
      matchSimilarity:  best.featureSim,
      treatmentOutcome,
      controlOutcome,
      causalEffect,
    })
  }

  return matches
}

export function aggregateCausalEffect(
  matches:    PropensityMatch[],
  minMatches: number,
  confidenceThreshold: number,
): { effect: number; confidence: CausalConfidence; matchCount: number } {
  const validMatches = matches.filter((m) => m.controlId !== null)

  if (validMatches.length < minMatches) {
    return { effect: 0, confidence: 'correlation_only', matchCount: validMatches.length }
  }

  const avgEffect = validMatches.reduce((s, m) => s + m.causalEffect, 0) / validMatches.length
  const avgSimilarity = validMatches.reduce((s, m) => s + m.matchSimilarity, 0) / validMatches.length

  const confidence: CausalConfidence = avgSimilarity >= confidenceThreshold
    ? 'high'
    : avgSimilarity >= 0.4
    ? 'estimated'
    : 'correlation_only'

  return { effect: avgEffect, confidence, matchCount: validMatches.length }
}

// =============================================================================
// LEARNING ENGINE V2 FACTORY
// =============================================================================

export interface LearningEngineV2Instance {
  trainModel:              (contextKey: string, observations: TrainingObservation[]) => Promise<MLModelWeights>
  getCalibratedProbability: (contextKey: string, features: FeatureVector) => Promise<number>
  computeCausalEffect:     (actionType: string, treatmentDealIds: string[], controlDealIds: string[]) => Promise<CausalEffect>
  getActiveModel:          (contextKey: string) => Promise<MLModelWeights | null>
  detectDrift:             () => Promise<Array<{ type: string; severity: string; delta: number }>>
  getModelHealth:          (contextKey: string) => Promise<number>
}

export function createLearningEngineV2(
  db:       SupabaseClient,
  eventBus: EventBusInstance,
  config:   LearningEngineV2Config = DEFAULT_LR_CONFIG,
  logger:   Logger = createConsoleLogger() as unknown as Logger,
): LearningEngineV2Instance {

  // ==========================================================================
  // TRAIN MODEL
  // ==========================================================================

  async function trainModel(
    contextKey:   string,
    observations: TrainingObservation[],
  ): Promise<MLModelWeights> {
    if (observations.length < config.minSampleSize) {
      throw new Error(`Insufficient training data for "${contextKey}": ${observations.length}`)
    }

    // Train LR
    const trainResult = trainLogisticRegression(observations, config)

    // Choose calibration method
    const method: CalibrationMethod = config.calibrationMethod === 'auto'
      ? observations.length >= config.calibrationThreshold ? 'isotonic' : 'platt'
      : config.calibrationMethod

    let platt: PlattCalibration | undefined
    let isotonicBins: IsotonicBin[] | undefined

    if (method !== 'none') {
      // Generate raw scores + outcomes for calibration
      const rawScores = observations.map((o) => predict(featureVectorToArray(o.features), trainResult.weights, trainResult.bias))
      const outcomes  = observations.map((o) => o.outcome as number)

      if (method === 'platt') {
        platt = fitPlattScaling(rawScores, outcomes)
      } else if (method === 'isotonic') {
        isotonicBins = fitIsotonicRegression(rawScores, outcomes)
      }
    }

    const modelVersion = `v${Date.now()}`

    const modelWeights: MLModelWeights = {
      contextKey,
      weights:            trainResult.weights,
      bias:               trainResult.bias,
      calibrationMethod:  method,
      platt,
      isotonicBins,
      sampleSize:         observations.length,
      trainLoss:          trainResult.finalLoss,
      valAccuracy:        trainResult.valAccuracy,
      regularization:     config.regularizationStrength,
      trainedAt:          new Date().toISOString(),
      version:            modelVersion,
    }

    // Deactivate old models for this context
    await db
      .from('ml_model_weights')
      .update({ is_active: false })
      .eq('context_key', contextKey)
      .eq('is_active', true)

    // Persist new model
    const { error } = await db.from('ml_model_weights').insert({
      context_key:         contextKey,
      model_version:       modelVersion,
      weights:             trainResult.weights,
      bias:                trainResult.bias,
      calibration_method:  method,
      platt_a:             platt?.A ?? null,
      platt_b:             platt?.B ?? null,
      isotonic_bins:       isotonicBins
        ? isotonicBins.map((b) => ({ x_min: b.xMin, x_max: b.xMax, y_value: b.yValue }))
        : null,
      sample_size:         observations.length,
      train_loss:          trainResult.finalLoss,
      val_accuracy:        trainResult.valAccuracy,
      regularization:      config.regularizationStrength,
      is_active:           true,
    })

    if (error) throw new Error(`Failed to persist model: ${error.message}`)

    logger.info('learningEngineV2', 'model.trained', {
      contextKey,
      version:     modelVersion,
      sampleSize:  observations.length,
      valAccuracy: trainResult.valAccuracy,
      calibration: method,
    })

    // Emit event
    await eventBus.publish({
      eventType:  EVENT_TYPES.AUTOMATION_TRIGGERED,
      entityType: 'ml_model_weights',
      entityId:   '00000000-0000-0000-0000-000000000000',
      payload: {
        automationType: 'learning.updated',
        entityType:     'ml_model_weights',
        result: {
          contextKey,
          version:     modelVersion,
          valAccuracy: trainResult.valAccuracy,
          calibration: method,
          sampleSize:  observations.length,
        },
      },
    })

    return modelWeights
  }

  // ==========================================================================
  // GET ACTIVE MODEL
  // ==========================================================================

  async function getActiveModel(contextKey: string): Promise<MLModelWeights | null> {
    const { data, error } = await db
      .from('ml_model_weights')
      .select()
      .eq('context_key', contextKey)
      .eq('is_active', true)
      .order('trained_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null

    const row = data as Record<string, unknown>
    return {
      contextKey:          row.context_key as string,
      weights:             row.weights as number[],
      bias:                Number(row.bias),
      calibrationMethod:   (row.calibration_method as CalibrationMethod) ?? 'none',
      platt:               row.platt_a != null
        ? { A: Number(row.platt_a), B: Number(row.platt_b) }
        : undefined,
      isotonicBins:        row.isotonic_bins
        ? (row.isotonic_bins as Array<{ x_min: number; x_max: number; y_value: number }>).map(
            (b) => ({ xMin: b.x_min, xMax: b.x_max, yValue: b.y_value })
          )
        : undefined,
      sampleSize:          Number(row.sample_size),
      trainLoss:           Number(row.train_loss ?? 0),
      valAccuracy:         Number(row.val_accuracy ?? 0),
      regularization:      Number(row.regularization ?? config.regularizationStrength),
      trainedAt:           row.trained_at as string,
      version:             row.model_version as string,
    }
  }

  // ==========================================================================
  // GET CALIBRATED PROBABILITY
  // ==========================================================================

  async function getCalibratedProbability(
    contextKey: string,
    features:   FeatureVector,
  ): Promise<number> {
    const model = await getActiveModel(contextKey)

    if (!model) {
      // Fallback to Bayesian prior (no trained model)
      logger.warn('learningEngineV2', 'model.missing_fallback', { contextKey })
      return 0.25
    }

    const featureArr = featureVectorToArray(features)
    const prob = calibratedPredict(featureArr, model)

    // Confidence check
    if (model.sampleSize < config.minSampleSize) {
      logger.warn('learningEngineV2', 'model.low_confidence', { contextKey, sampleSize: model.sampleSize })
      return 0.25  // baseline
    }

    return Math.max(0, Math.min(1, prob))
  }

  // ==========================================================================
  // COMPUTE CAUSAL EFFECT
  // ==========================================================================

  async function computeCausalEffect(
    actionType:        string,
    treatmentDealIds:  string[],
    controlDealIds:    string[],
  ): Promise<CausalEffect> {
    // Fetch signals for both groups
    const { data: treatmentSignals } = await db
      .from('closed_deal_signals')
      .select('deal_id, outcome, final_composite_score, days_to_close, agent_id')
      .in('deal_id', treatmentDealIds)

    const { data: controlSignals } = await db
      .from('closed_deal_signals')
      .select('deal_id, outcome, final_composite_score, days_to_close, agent_id')
      .in('deal_id', controlDealIds)

    const treatObs: TrainingObservation[] = (treatmentSignals ?? []).map((s) => ({
      dealId:  s.deal_id as string,
      outcome: (s.outcome === 'won' ? 1 : 0) as 1 | 0,
      weight:  1.0,
      features: {
        dealValueNormalized:    0.5,
        timeToCloseNormalized:  s.days_to_close ? Math.min(1, Number(s.days_to_close) / 90) : 0.5,
        decisionScore:          s.final_composite_score ? Number(s.final_composite_score) / 100 : 0.5,
        agentScore:             0.5,
        stageTransitionRate:    0.5,
        failureRate:            0,
        inactivityDuration:     0,
        dealAge:                0.5,
        difficultyScore:        0.5,
        effortScore:            0.5,
        propertyTypeEncoded:    0.5,
        projectStageEncoded:    0.5,
        developerScoreEncoded:  0.5,
        financingAvailable:     0.5,
        legalStatusEncoded:     0.5,
      },
    }))

    const ctrlObs: TrainingObservation[] = (controlSignals ?? []).map((s) => ({
      dealId:  s.deal_id as string,
      outcome: (s.outcome === 'won' ? 1 : 0) as 1 | 0,
      weight:  1.0,
      features: {
        dealValueNormalized:    0.5,
        timeToCloseNormalized:  s.days_to_close ? Math.min(1, Number(s.days_to_close) / 90) : 0.5,
        decisionScore:          s.final_composite_score ? Number(s.final_composite_score) / 100 : 0.5,
        agentScore:             0.5,
        stageTransitionRate:    0.5,
        failureRate:            0,
        inactivityDuration:     0,
        dealAge:                0.5,
        difficultyScore:        0.5,
        effortScore:            0.5,
        propertyTypeEncoded:    0.5,
        projectStageEncoded:    0.5,
        developerScoreEncoded:  0.5,
        financingAvailable:     0.5,
        legalStatusEncoded:     0.5,
      },
    }))

    if (treatObs.length < 3 || ctrlObs.length < 3) {
      return {
        actionType,
        causalEffect:     0,
        causalConfidence: 'correlation_only',
        treatmentSamples: treatObs.length,
        controlSamples:   ctrlObs.length,
        propensityScores: [],
      }
    }

    // Build a simple model for propensity scoring
    const allObs = [...treatObs, ...ctrlObs]

    let model = await getActiveModel('default')
    if (!model && allObs.length >= config.minSampleSize) {
      model = await trainModel('default', allObs)
    }

    if (!model) {
      return {
        actionType,
        causalEffect:     0,
        causalConfidence: 'correlation_only',
        treatmentSamples: treatObs.length,
        controlSamples:   ctrlObs.length,
        propensityScores: [],
      }
    }

    const propensityScores = computePropensityScores(allObs, model)
    const matches = matchTreatmentControlPairs(
      treatObs, ctrlObs, propensityScores, config.propensityMatchingK
    )

    const { effect, confidence, matchCount } = aggregateCausalEffect(
      matches,
      3,
      config.causalConfidenceThreshold,
    )

    // Persist to causal_action_records
    for (const m of matches.filter((x) => x.controlId !== null).slice(0, 10)) {
      await db.from('causal_action_records').insert({
        action_type:           actionType,
        treatment_entity_id:   m.treatmentId,
        control_entity_id:     m.controlId,
        treatment_outcome:     m.treatmentOutcome,
        control_outcome:       m.controlOutcome,
        propensity_score:      m.propensityScore,
        matched_similarity:    m.matchSimilarity,
        causal_effect:         m.causalEffect,
        causal_confidence:     confidence,
        context_features:      {},
      })
    }

    return {
      actionType,
      causalEffect:     effect,
      causalConfidence: confidence,
      treatmentSamples: treatObs.length,
      controlSamples:   ctrlObs.length,
      propensityScores: Array.from(propensityScores.values()),
    }
  }

  // ==========================================================================
  // DETECT DRIFT
  // ==========================================================================

  async function detectDrift(): Promise<Array<{ type: string; severity: string; delta: number }>> {
    const signals: Array<{ type: string; severity: string; delta: number }> = []
    const cutoff30 = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const cutoff60 = new Date(Date.now() - 60 * 86_400_000).toISOString()

    const [recent, older] = await Promise.all([
      db.from('closed_deal_signals').select('outcome').gte('captured_at', cutoff30),
      db.from('closed_deal_signals').select('outcome').gte('captured_at', cutoff60).lt('captured_at', cutoff30),
    ])

    const r = recent.data ?? []
    const o = older.data  ?? []

    if (r.length < 3 || o.length < 3) return signals

    const rWin = r.filter((d) => d.outcome === 'won').length / r.length
    const oWin = o.filter((d) => d.outcome === 'won').length / o.length

    if (oWin > 0) {
      const deltaPct = Math.abs((rWin - oWin) / oWin) * 100
      if (deltaPct > config.driftThresholdPct) {
        signals.push({
          type:     'conversion_drop',
          severity: deltaPct > 40 ? 'critical' : 'medium',
          delta:    deltaPct,
        })
      }
    }

    if (signals.length > 0) {
      await eventBus.publish({
        eventType:  EVENT_TYPES.AUTOMATION_TRIGGERED,
        entityType: 'ml_model_weights',
        entityId:   '00000000-0000-0000-0000-000000000000',
        payload: {
          automationType: 'learning.drift.detected',
          result:         { signalCount: signals.length, types: signals.map((s) => s.type) },
        },
      })
    }

    return signals
  }

  // ==========================================================================
  // GET MODEL HEALTH
  // ==========================================================================

  async function getModelHealth(contextKey: string): Promise<number> {
    const model = await getActiveModel(contextKey)
    if (!model) return 0

    const accuracyScore = Math.round(model.valAccuracy * 100)
    const sampleScore   = Math.min(50, model.sampleSize / 4)
    const recencyMs     = Date.now() - new Date(model.trainedAt).getTime()
    const recencyScore  = Math.max(0, 50 - recencyMs / (7 * 86_400_000) * 10)

    return Math.round(accuracyScore * 0.5 + sampleScore + recencyScore * 0.1)
  }

  return {
    trainModel,
    getCalibratedProbability,
    computeCausalEffect,
    getActiveModel,
    detectDrift,
    getModelHealth,
  }
}
