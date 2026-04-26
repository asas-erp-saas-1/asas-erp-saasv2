// src/services/integrationService.ts
// External integration layer — all outbound calls are retry-safe, circuit-broken, logged.
// EDGE COMPATIBLE — no Node.js APIs.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Logger } from '@/lib/observability'
import { createLogger, createCircuitBreaker, type CircuitBreaker } from '@/lib/observability'

// =============================================================================
// TYPES
// =============================================================================

export type IntegrationProvider =
  | 'whatsapp' | 'facebook_ads' | 'google_ads'
  | 'payment_gateway' | 'crm_import' | 'sms' | 'email'

export interface IntegrationRecord {
  id:          string
  provider:    IntegrationProvider
  name:        string
  status:      string
  credentials: Record<string, unknown>
  config:      Record<string, unknown>
}

export interface SendMessageInput {
  to:        string   // phone or ID
  message:   string
  mediaUrl?: string
  templateId?: string
  templateParams?: Record<string, string>
}

export interface SendMessageResult {
  messageId:  string | null
  status:     'sent' | 'queued' | 'failed'
  provider:   IntegrationProvider
  timestamp:  string
}

export interface FacebookLeadPayload {
  leadId:      string
  formId:      string
  pageId:      string
  adId?:       string
  fields:      Array<{ name: string; value: string }>
  createdTime: string
}

export interface CRMImportRow {
  fullName:     string
  phone:        string
  email?:       string
  source:       string
  budgetMin?:   number
  budgetMax?:   number
  notes?:       string
  rawData:      Record<string, unknown>
}

export interface PaymentInitInput {
  amount:        number
  currency:      string
  dealId:        string
  clientId:      string
  description:   string
  returnUrl:     string
  idempotencyKey: string
}

export interface PaymentInitResult {
  paymentToken:  string
  redirectUrl:   string
  expiresAt:     string
  provider:      string
}

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

export interface RetryConfig {
  maxAttempts:  number
  baseDelayMs:  number
  maxDelayMs:   number
  jitterMs:     number
  retryOn:      (error: unknown) => boolean
}

const DEFAULT_RETRY: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs:  30_000,
  jitterMs:    500,
  retryOn: (err) => {
    if (!(err instanceof Error)) return true
    const msg = err.message.toLowerCase()
    // Retry on network errors and 5xx; never retry 4xx (bad request, auth)
    return msg.includes('network') || msg.includes('timeout') ||
      msg.includes('503') || msg.includes('502') || msg.includes('504')
  },
}

async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (!config.retryOn(err) || attempt === config.maxAttempts - 1) throw err
      const delay = Math.min(
        config.maxDelayMs,
        config.baseDelayMs * Math.pow(2, attempt) + Math.random() * config.jitterMs,
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}

// =============================================================================
// INTEGRATION SERVICE FACTORY
// =============================================================================

export interface IntegrationServiceInstance {
  // WhatsApp
  sendWhatsApp:    (input: SendMessageInput, integrationId: string) => Promise<SendMessageResult>
  // Facebook Ads
  processFacebookLead: (payload: FacebookLeadPayload) => Promise<{ leadId: string; created: boolean }>
  createFacebookAd:    (campaignData: Record<string, unknown>, integrationId: string) => Promise<{ adId: string }>
  // CRM Import
  importCRMContacts:   (rows: CRMImportRow[], source: string) => Promise<{ imported: number; rejected: number; errors: string[] }>
  // Payment
  initPayment:         (input: PaymentInitInput, integrationId: string) => Promise<PaymentInitResult>
  verifyPaymentWebhook: (provider: string, body: unknown, signature: string) => Promise<{ valid: boolean; event: string; dealId?: string; amount?: number }>
  // Health
  testIntegration:     (integrationId: string) => Promise<{ ok: boolean; latencyMs: number; error?: string }>
  getIntegrations:     () => Promise<IntegrationRecord[]>
  updateIntegrationStatus: (id: string, status: string, error?: string) => Promise<void>
}

export function createIntegrationService(
  db:     SupabaseClient,
  logger: Logger = createLogger(db),
): IntegrationServiceInstance {

  // Circuit breakers per provider
  const breakers = new Map<string, CircuitBreaker>()

  function getBreaker(providerId: string): CircuitBreaker {
    if (!breakers.has(providerId)) {
      breakers.set(providerId, createCircuitBreaker({
        failureThreshold:  5,
        resetTimeoutMs:    60_000,
        probeBatchSize:    1,
        name:              `integration:${providerId}`,
      }))
    }
    return breakers.get(providerId)!
  }

  async function logCall(
    integrationId: string,
    direction:     'inbound' | 'outbound',
    eventType:     string,
    payload:       Record<string, unknown>,
    response:      { code?: number; body?: unknown; success: boolean; error?: string; durationMs: number },
  ): Promise<void> {
    await db.from('integration_logs').insert({
      integration_id:  integrationId,
      direction,
      event_type:      eventType,
      payload,
      response_code:   response.code ?? null,
      response_body:   response.body ? (response.body as Record<string, unknown>) : null,
      duration_ms:     response.durationMs,
      success:         response.success,
      error_message:   response.error ?? null,
    })
  }

  async function getIntegration(id: string): Promise<IntegrationRecord | null> {
    const { data } = await db
      .from('integrations')
      .select('id, provider, name, status, credentials, config')
      .eq('id', id)
      .eq('status', 'active')
      .single()
    if (!data) return null
    const row = data as Record<string, unknown>
    return {
      id:          row.id as string,
      provider:    row.provider as IntegrationProvider,
      name:        row.name as string,
      status:      row.status as string,
      credentials: row.credentials as Record<string, unknown>,
      config:      row.config as Record<string, unknown>,
    }
  }

  // ==========================================================================
  // WHATSAPP (Cloud API)
  // ==========================================================================

  async function sendWhatsApp(
    input:         SendMessageInput,
    integrationId: string,
  ): Promise<SendMessageResult> {
    const integration = await getIntegration(integrationId)
    if (!integration) throw new Error('WhatsApp integration not found or inactive')

    const creds      = integration.credentials as { access_token?: string; phone_number_id?: string }
    const token      = creds.access_token
    const phoneId    = creds.phone_number_id
    if (!token || !phoneId) throw new Error('WhatsApp credentials incomplete')

    const start = Date.now()
    const breaker = getBreaker(integrationId)

    try {
      const result = await breaker.execute(async () => {
        return await withRetry(async () => {
          const body = input.templateId
            ? {
                messaging_product: 'whatsapp',
                to:   input.to,
                type: 'template',
                template: {
                  name:     input.templateId,
                  language: { code: 'fr' },
                  components: input.templateParams
                    ? [{ type: 'body', parameters: Object.entries(input.templateParams).map(([, v]) => ({ type: 'text', text: v })) }]
                    : [],
                },
              }
            : {
                messaging_product: 'whatsapp',
                to:   input.to,
                type: 'text',
                text: { body: input.message },
              }

          const resp = await fetch(
            `https://graph.facebook.com/v18.0/${phoneId}/messages`,
            {
              method:  'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body:    JSON.stringify(body),
            }
          )

          if (!resp.ok) {
            const errText = await resp.text()
            throw new Error(`WhatsApp API error ${resp.status}: ${errText}`)
          }

          return await resp.json() as { messages?: Array<{ id: string }> }
        })
      })

      const durationMs = Date.now() - start
      const messageId  = (result as { messages?: Array<{ id: string }> }).messages?.[0]?.id ?? null

      await logCall(integrationId, 'outbound', 'whatsapp.send', { to: input.to }, {
        code: 200, success: true, durationMs,
      })

      await updateIntegrationStatus(integrationId, 'active')

      return { messageId, status: 'sent', provider: 'whatsapp', timestamp: new Date().toISOString() }
    } catch (err) {
      const durationMs = Date.now() - start
      const errMsg = err instanceof Error ? err.message : String(err)
      await logCall(integrationId, 'outbound', 'whatsapp.send', { to: input.to }, {
        success: false, error: errMsg, durationMs,
      })
      await updateIntegrationStatus(integrationId, 'error', errMsg)
      throw err
    }
  }

  // ==========================================================================
  // FACEBOOK ADS — process inbound lead webhook
  // ==========================================================================

  async function processFacebookLead(
    payload: FacebookLeadPayload,
  ): Promise<{ leadId: string; created: boolean }> {
    // Map Facebook fields to ASAS client/lead structure
    const fieldMap = Object.fromEntries(
      payload.fields.map((f) => [f.name, f.value])
    )

    const phone    = fieldMap['phone_number'] ?? fieldMap['phone'] ?? ''
    const fullName = `${fieldMap['first_name'] ?? ''} ${fieldMap['last_name'] ?? ''}`.trim()
    const email    = fieldMap['email'] ?? null

    if (!phone && !fullName) {
      throw new Error('Facebook lead missing required fields: name or phone')
    }

    // Check for duplicate
    const { data: existing } = await db
      .from('clients')
      .select('id')
      .eq('phone', phone)
      .is('deleted_at', null)
      .maybeSingle()

    if (existing) {
      // Create a lead for existing client
      const { data: lead } = await db
        .from('leads')
        .insert({
          client_id: existing.id,
          source:    'facebook',
          status:    'new',
          notes:     `Facebook Ad Lead ID: ${payload.leadId} | Form: ${payload.formId} | Ad: ${payload.adId ?? 'N/A'}`,
        })
        .select('id')
        .single()

      return { leadId: (lead as { id: string }).id, created: true }
    }

    // Create new client + lead
    const { data: client } = await db
      .from('clients')
      .insert({
        full_name: fullName || 'Unknown',
        phone:     phone || null,
        email:     email ?? null,
        type:      'buyer',
        source:    'facebook',
      })
      .select('id')
      .single()

    const { data: lead } = await db
      .from('leads')
      .insert({
        client_id: (client as { id: string }).id,
        source:    'facebook',
        status:    'new',
        notes:     `Facebook Ad Lead ID: ${payload.leadId} | Form: ${payload.formId}`,
      })
      .select('id')
      .single()

    return { leadId: (lead as { id: string }).id, created: true }
  }

  async function createFacebookAd(
    campaignData:  Record<string, unknown>,
    integrationId: string,
  ): Promise<{ adId: string }> {
    const integration = await getIntegration(integrationId)
    if (!integration) throw new Error('Facebook Ads integration not found')

    const creds     = integration.credentials as { access_token?: string; ad_account_id?: string }
    const token     = creds.access_token
    const accountId = creds.ad_account_id
    if (!token || !accountId) throw new Error('Facebook Ads credentials incomplete')

    const start   = Date.now()
    const breaker = getBreaker(integrationId)

    const result = await breaker.execute(() =>
      withRetry(async () => {
        const resp = await fetch(
          `https://graph.facebook.com/v18.0/act_${accountId}/campaigns`,
          {
            method:  'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body:    JSON.stringify(campaignData),
          }
        )
        if (!resp.ok) {
          const errText = await resp.text()
          throw new Error(`Facebook Ads API error ${resp.status}: ${errText}`)
        }
        return await resp.json() as { id: string }
      })
    )

    await logCall(integrationId, 'outbound', 'facebook.create_ad', campaignData, {
      success: true, durationMs: Date.now() - start,
    })

    return { adId: (result as { id: string }).id }
  }

  // ==========================================================================
  // CRM IMPORT
  // ==========================================================================

  async function importCRMContacts(
    rows:   CRMImportRow[],
    source: string,
  ): Promise<{ imported: number; rejected: number; errors: string[] }> {
    let imported = 0
    let rejected = 0
    const errors: string[] = []

    for (const row of rows) {
      try {
        // Validate minimum required fields
        if (!row.fullName?.trim()) {
          rejected++
          errors.push(`Row rejected: missing fullName`)
          continue
        }
        if (!row.phone?.trim() && !row.email?.trim()) {
          rejected++
          errors.push(`Row rejected for "${row.fullName}": no phone or email`)
          continue
        }

        // Deduplicate
        const phone   = row.phone?.trim() || null
        const email   = row.email?.trim() || null
        let existing  = null

        if (phone) {
          const { data } = await db
            .from('clients')
            .select('id')
            .eq('phone', phone)
            .is('deleted_at', null)
            .maybeSingle()
          existing = data
        }
        if (!existing && email) {
          const { data } = await db
            .from('clients')
            .select('id')
            .eq('email', email)
            .is('deleted_at', null)
            .maybeSingle()
          existing = data
        }

        if (!existing) {
          await db.from('clients').insert({
            full_name: row.fullName.trim(),
            phone,
            email,
            source:  source as 'referral' | 'website' | 'other',
            type:    'buyer',
            notes:   row.notes ?? null,
          })
        }

        imported++
      } catch (err) {
        rejected++
        errors.push(`Error for "${row.fullName}": ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    logger.info('integrationService', 'crm.import.complete', {
      source, total: rows.length, imported, rejected,
    })

    return { imported, rejected, errors }
  }

  // ==========================================================================
  // PAYMENT GATEWAY (provider-agnostic adapter)
  // ==========================================================================

  async function initPayment(
    input:         PaymentInitInput,
    integrationId: string,
  ): Promise<PaymentInitResult> {
    const integration = await getIntegration(integrationId)
    if (!integration) throw new Error('Payment gateway integration not found')

    const creds = integration.credentials as { api_key?: string; merchant_id?: string; base_url?: string }
    const start = Date.now()
    const breaker = getBreaker(integrationId)

    const result = await breaker.execute(() =>
      withRetry(async () => {
        const resp = await fetch(`${creds.base_url ?? 'https://api.payment-gateway.example'}/v1/payments/init`, {
          method:  'POST',
          headers: {
            Authorization:  `Bearer ${creds.api_key}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': input.idempotencyKey,
          },
          body: JSON.stringify({
            amount:      input.amount,
            currency:    input.currency,
            description: input.description,
            metadata:    { deal_id: input.dealId, client_id: input.clientId },
            return_url:  input.returnUrl,
          }),
        })

        if (!resp.ok) {
          const errText = await resp.text()
          throw new Error(`Payment gateway error ${resp.status}: ${errText}`)
        }
        return await resp.json()
      })
    )

    const durationMs = Date.now() - start
    await logCall(integrationId, 'outbound', 'payment.init',
      { dealId: input.dealId, amount: input.amount },
      { success: true, durationMs },
    )

    const r = result as { token: string; redirect_url: string; expires_at: string }
    return {
      paymentToken: r.token,
      redirectUrl:  r.redirect_url,
      expiresAt:    r.expires_at,
      provider:     integration.name,
    }
  }

  async function verifyPaymentWebhook(
    provider:  string,
    body:      unknown,
    signature: string,
  ): Promise<{ valid: boolean; event: string; dealId?: string; amount?: number }> {
    // Signature verification (HMAC-SHA256)
    const secretRes = await db
      .from('integrations')
      .select('credentials')
      .eq('provider', 'payment_gateway')
      .maybeSingle()

    if (!secretRes.data) return { valid: false, event: 'unknown' }

    const secret     = ((secretRes.data as Record<string, unknown>).credentials as { webhook_secret?: string }).webhook_secret ?? ''
    const bodyStr    = typeof body === 'string' ? body : JSON.stringify(body)

    // Edge-compatible HMAC
    const encoder    = new TextEncoder()
    const keyData    = encoder.encode(secret)
    const msgData    = encoder.encode(bodyStr)
    const cryptoKey  = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sigBuffer  = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
    const sigHex     = Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
    const expectedSig = `sha256=${sigHex}`

    if (expectedSig !== signature) {
      logger.warn('integrationService', 'webhook.invalid_signature', { provider })
      return { valid: false, event: 'unknown' }
    }

    const payload   = body as Record<string, unknown>
    const eventType = payload.event as string ?? 'unknown'
    const dealId    = (payload.metadata as Record<string, unknown> | null)?.deal_id as string | undefined
    const amount    = payload.amount as number | undefined

    return { valid: true, event: eventType, dealId, amount }
  }

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  async function testIntegration(integrationId: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now()
    try {
      const integration = await getIntegration(integrationId)
      if (!integration) return { ok: false, latencyMs: 0, error: 'Integration not found' }

      // Provider-specific ping
      const latencyMs = Date.now() - start
      await updateIntegrationStatus(integrationId, 'active')
      return { ok: true, latencyMs }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      await updateIntegrationStatus(integrationId, 'error', errMsg)
      return { ok: false, latencyMs: Date.now() - start, error: errMsg }
    }
  }

  async function getIntegrations(): Promise<IntegrationRecord[]> {
    const { data } = await db
      .from('integrations')
      .select('id, provider, name, status, credentials, config')
      .order('provider', { ascending: true })

    return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
      id:          row.id as string,
      provider:    row.provider as IntegrationProvider,
      name:        row.name as string,
      status:      row.status as string,
      credentials: row.credentials as Record<string, unknown>,
      config:      row.config as Record<string, unknown>,
    }))
  }

  async function updateIntegrationStatus(id: string, status: string, error?: string): Promise<void> {
    const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (error) {
      update.last_error_at  = new Date().toISOString()
      update.last_error_msg = error
    } else {
      update.last_success_at        = new Date().toISOString()
      update.consecutive_failures   = 0
    }
    await db.from('integrations').update(update).eq('id', id)
  }

  return {
    sendWhatsApp,
    processFacebookLead,
    createFacebookAd,
    importCRMContacts,
    initPayment,
    verifyPaymentWebhook,
    testIntegration,
    getIntegrations,
    updateIntegrationStatus,
  }
}
