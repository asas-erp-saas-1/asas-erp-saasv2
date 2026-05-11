// src/app/api/command-gateway/route.ts
import { NextResponse } from 'next/server';
import { kernel } from '@/lib/kernel/core';
import { ErrorTracker } from '@/lib/observability/errors';

export async function POST(request: Request) {
  try {
    const identity = await kernel.identity();
    const command = await request.json();

    // The command object looks like:
    // {
    //   commandId: string,
    //   aggregateId: string,
    //   type: string,
    //   expectedVersion: number,
    //   payload: any
    // }

    // Physical Event Sourcing validation should happen here. 
    // But since the scope is transitioning next.js to command logic, we execute a command wrapper.
    
    // In our simplified Kernel wrapper, we map common command types to Kernel Mutates.
    // For deals:
    if (command.type === 'SET_DEAL_STAGE') {
      const { stage, notes, lostReason } = command.payload;
      
      const payload: any = {
        status: stage,
        version: command.expectedVersion + 1
      };
      if (lostReason) payload.lost_reason = lostReason;
      if (notes) payload.notes = notes;

      const deal = await kernel.mutate('deals', 'UPDATE', payload, { id: command.aggregateId });
      return NextResponse.json({ success: true, data: deal });
    }

    if (command.type === 'SET_LEAD_STATUS') {
      const { status } = command.payload;
      const payload: any = {
        status,
        last_activity: new Date().toISOString()
      };
      const lead = await kernel.mutate('leads', 'UPDATE', payload, { id: command.aggregateId });
      return NextResponse.json({ success: true, data: lead });
    }

    if (command.type === 'LOG_DEPOSIT') {
      const { amount, method, notes } = command.payload;
      const payment = await kernel.mutate('deal_payments', 'INSERT', {
        deal_id: command.aggregateId,
        amount,
        status: 'pending',
        due_date: new Date().toISOString(), // Avance is logged today
      });
      return NextResponse.json({ success: true, data: payment });
    }

    if (command.type === 'TRIGGER_PROJECT_TRANCHE') {
      const { projectId, trancheLabel, tranchePct } = command.payload;
      const { DealService } = await import('@/services/deals/deal.service');
      const allDeals = await DealService.getDeals();
      const projectDeals = allDeals.filter((d: any) => 
        d.properties?.projects?.id === projectId && 
        ['active', 'negotiation', 'notary', 'closed'].includes(d.status)
      );

      for (const deal of projectDeals) {
        const agreedPrice = (deal as any).agreed_price || (deal as any).amount || 0;
        const amountToCall = agreedPrice * (tranchePct / 100);
        
        await DealService.registerPayment(deal.id, amountToCall, new Date().toISOString());

        await kernel.mutate('activities', 'INSERT', {
          agency_id: identity.tenantId,
          deal_id: deal.id,
          type: 'appel_fonds',
          user_id: identity.userId,
          description: `Appel de fonds émis : ${trancheLabel} (${tranchePct}% = ${amountToCall.toLocaleString()} DZD)`
        });
      }

      return NextResponse.json({ success: true, dispatched: projectDeals.length });
    }

    return NextResponse.json({ error: 'Unknown command type' }, { status: 400 });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'CommandGateway' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
