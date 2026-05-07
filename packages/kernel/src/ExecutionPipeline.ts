import { KernelContext } from './ContextHydrator';

export interface Command<T = any> {
  type: string;
  aggregateId: string;
  expectedVersion: number;
  payload: T;
}

export interface TransitionResult<TState, TEvent> {
  nextState: TState;
  events: TEvent[];
}

export interface StateMachine<TState, TCommand, TEvent> {
  transition(state: TState, command: TCommand): TransitionResult<TState, TEvent>;
}

export interface Repository<TState> {
  get(id: string, ctx: KernelContext): Promise<TState>;
  save(state: TState, command: Command, ctx: KernelContext, tx: any): Promise<void>;
}

export interface OutboxAdapter {
  append(events: any[], ctx: KernelContext, tx: any): Promise<void>;
}

export interface Pipeline<TState, TCommand, TEvent> {
  repository: Repository<TState>;
  stateMachine: StateMachine<TState, TCommand, TEvent>;
  outbox: OutboxAdapter;
}

export class Kernel {
  static async execute<TState, TCommand extends Command, TEvent>(
    ctx: KernelContext,
    command: TCommand,
    pipeline: Pipeline<TState, TCommand, TEvent>
  ) {
    console.log(`[KERNEL EXEC] Trace: ${ctx.traceId} | Cmd: ${command.type}`);

    // 1. Fetch current state securely bounded by tenant
    const currentState = await pipeline.repository.get(command.aggregateId, ctx);

    // 2. Pure state transition executing DDD business logic
    const { nextState, events } = pipeline.stateMachine.transition(currentState, command);

    if (ctx.isShadow) {
      console.log(`[KERNEL SHADOW] Would commit to DB:`, { nextState, events });
      return nextState;
    }

    // 3. PostgreSQL RPC execution (Atomic Write + Outbox)
    // Here we simulate the physical RPC call that takes both state and events
    const rpcPayload = {
      tenant_id: ctx.identity.tenantId,
      aggregate_id: command.aggregateId,
      expected_version: command.expectedVersion,
      state_payload: nextState,
      outbox_events: events.map(e => ({
        event_id: crypto.randomUUID(),
        type: (e as any).type,
        payload: e,
        trace_id: ctx.traceId
      }))
    };

    const { error } = await ctx.db.rpc('core_execute_mutation', rpcPayload);
    
    if (error) {
      if (error.code === 'P0001' && error.message.includes('version_conflict')) {
         throw new Error(`OptimisticLockException: ${command.aggregateId} modified by another actor.`);
      }
      throw new Error(`InfrastructureException: ${error.message}`);
    }

    // 4. Return canonical state to front end
    return nextState;
  }
}
