import { DomainEventEnvelope } from '../../contracts';

export class EventOrderingCoordinator {
  /**
   * Ensures that a worker processing an event is processing the correct sequence.
   * Prevents out-of-order execution storms from breaking aggregate state.
   */
  static validateCausalSequence(incomingEvent: DomainEventEnvelope, lastProcessedVersion: number) {
    if (incomingEvent.version <= lastProcessedVersion) {
       throw new Error(`[CAUSAL VIOLATION] Stale Event. Stream Version: ${lastProcessedVersion}, Event Version: ${incomingEvent.version}`);
    }

    if (incomingEvent.version > lastProcessedVersion + 1) {
       // Detected an ordering violation. E.g. we processed v3, and v5 arrived before v4 due to QStash concurrent delivery.
       throw new OutOfOrderEventException(`[CAUSAL GAP] Missing sequence. Stream: ${lastProcessedVersion}, Arrived: ${incomingEvent.version}`);
    }

    return true;
  }
}

export class OutOfOrderEventException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutOfOrderEventException';
    // By throwing this, the worker halts. QStash retries. 
    // Ideally, v4 arrives and processes smoothly, moving Stream=4. 
    // Then QStash retries v5, which now passes sequence validation.
  }
}
