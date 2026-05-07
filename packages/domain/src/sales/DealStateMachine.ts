export enum DealStatus {
  PROSPECTING = 'prospecting',
  NEGOTIATING = 'negotiating',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost'
}

export interface DealState {
  id: string;
  version: number;
  status: DealStatus;
  agreedPrice: number;
}

export interface SetDealStageCommand {
  type: 'SET_DEAL_STAGE';
  aggregateId: string;
  expectedVersion: number;
  payload: {
    stage: DealStatus;
  };
}

export class DealStateMachine {
  static transition(state: DealState, command: SetDealStageCommand) {
    if (state.status === DealStatus.CLOSED_WON || state.status === DealStatus.CLOSED_LOST) {
      throw new Error(`BusinessRuleViolation: Cannot modify a terminal deal ${state.id}`);
    }

    if (command.payload.stage === DealStatus.CLOSED_WON && state.agreedPrice <= 0) {
      throw new Error(`BusinessRuleViolation: Cannot close a deal with 0 price.`);
    }

    const nextState: DealState = {
      ...state,
      status: command.payload.stage,
      version: state.version + 1
    };

    const event = {
      type: 'DEAL_STAGE_CHANGED',
      aggregateId: state.id,
      payload: {
        from: state.status,
        to: nextState.status
      }
    };

    return { nextState, events: [event] };
  }
}
