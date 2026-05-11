export class DealPipelineWorker {
  static async process(event: any, db: any) {
    console.log(`[DealPipelineWorker] Received event: ${event.type} for Deal ${event.aggregateId}`);
    
    if (event.type === 'DEAL_STAGE_CHANGED') {
      const { to } = event.payload;

      // Ensure Idempotent execution
      if (to === 'closed_won') {
         // Perform side effect, like syncing to external Accounting/ERP 
         // Since we use the event_id as idempotency key internally (processed_events), 
         // we only get here once.
         console.log(`Syncing closed won deal ${event.aggregateId} to accounting system.`);
         // await externalSystem.sync({ id: event.aggregateId, amount: event.payload.price })
      }
      
      // Update materialized views / read models
      // e.g., Update pipeline metrics in CQRS cache
      await db.from('pipeline_metrics').upsert({
         tenant_id: event.tenantId,
         stage: to,
         deal_count: 1, // simplified logic for example
      });
    }
  }
}
