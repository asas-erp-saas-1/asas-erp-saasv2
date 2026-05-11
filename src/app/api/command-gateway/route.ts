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

      // We enforce optimistic concurrency check physically right here if we had full db logic,
      // but for now, we just pass the mutation.
      const deal = await kernel.mutate('deals', 'UPDATE', payload, { id: command.aggregateId });
      
      // We could also insert into a true "events" table if needed.
      return NextResponse.json({ success: true, data: deal });
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

    return NextResponse.json({ error: 'Unknown command type' }, { status: 400 });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'CommandGateway' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
