import { DivergenceEngine } from './DivergenceEngine';
import { KernelContext } from '../ContextHydrator';
import { Kernel } from '../ExecutionPipeline';

export class ShadowExecutionOrchestrator {
  
  /**
   * Forks the request asynchronously. Executes the intent payload through the Kernel in a dry-run fashion.
   * Compares the Kernel's intended mutations against the Legacy path's actual outcome.
   */
  static async dualExecute<TCommand, TState>(
    command: TCommand,
    legacyExecutionTask: () => Promise<any>, // The legacy physical execution
    pipeline: any,
    ctx: KernelContext
  ): Promise<any> {
    
    // 1. Fire authoritative legacy path
    const legacyStart = Date.now();
    let legacyResult;
    let legacyError;

    try {
      legacyResult = await legacyExecutionTask();
    } catch (e) {
      legacyError = e;
    }
    const legacyDuration = Date.now() - legacyStart;

    // 2. Fire Shadow Path (Non-blocking conceptually, but we await to compare)
    // Create shadow context ensuring physical commits drop
    const shadowCtx = { ...ctx, isShadow: true };
    const kernelStart = Date.now();
    
    let kernelIntendedResult;
    let kernelError;

    try {
      // Execute StateMachine & yield projected State/Events
      kernelIntendedResult = await Kernel.execute(shadowCtx, command as any, pipeline);
    } catch (e) {
      kernelError = e;
    }
    const kernelDuration = Date.now() - kernelStart;

    // 3. Compute Divergence
    DivergenceEngine.compareAndReport(
      command,
      { result: legacyResult, error: legacyError, durationMs: legacyDuration },
      { intendedResult: kernelIntendedResult, error: kernelError, durationMs: kernelDuration },
      ctx.traceId
    );

    // 4. Preserve Production Continuity: ALWAYS return the legacy result/error 
    // unless authoritative mode was requested upstream.
    if (legacyError) throw legacyError;
    return legacyResult;
  }
}
