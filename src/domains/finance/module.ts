// src/domains/finance/module.ts

import { SystemEvent, EventHandler, CommandHandler, Command, AggregateRoot, globalEventBus, SystemEvents } from '@/lib/kernel/core';
import { inboxEngine } from '@/lib/kernel/inbox';

// ----- STATE MACHINE -----
export type PaymentState = 'SCHEDULED' | 'PENDING_VERIFICATION' | 'CLEARED' | 'REJECTED' | 'OVERDUE';

export class PaymentAggregate extends AggregateRoot<{ status: PaymentState, amount: number, dealId: string }> {
    
    registerReceipt(method: string, reference: string, userId: string) {
        if (this.state.status !== 'SCHEDULED' && this.state.status !== 'OVERDUE') {
            throw new Error("Payment can only be registered if scheduled or overdue.");
        }

        const event: SystemEvent = {
            id: crypto.randomUUID(),
            eventType: SystemEvents.PAYMENT_RECEIVED,
            aggregateType: 'Payment',
            aggregateId: this.id,
            sourceModule: 'Finance',
            payload: { method, reference },
            createdAt: new Date(),
            createdBy: userId
        };

        this.applyChange(event);
    }

    protected mutate(event: SystemEvent): void {
        if (event.eventType === SystemEvents.PAYMENT_RECEIVED) {
            this.state.status = 'PENDING_VERIFICATION';
        }
    }
}

// ----- DOMAIN EVENT HANDLERS -----

export class PaymentReceivedHandler implements EventHandler {
    async handle(event: SystemEvent): Promise<void> {
        console.log(`[FINANCE DOMAIN] Handling PaymentReceived for Payment ${event.aggregateId}`);
        
        // Push work to Accounting / Finance to reconcile bank statement
        await inboxEngine.generateTask({
            taskType: 'PAYMENT_RECONCILIATION',
            title: `Reconcile Payment Receipt: ${event.payload.reference}`,
            description: `Payment method: ${event.payload.method}`,
            priority: 'HIGH',
            status: 'PENDING',
            domain: 'Finance',
            referenceAggregateType: 'Payment',
            referenceAggregateId: event.aggregateId,
            roleTarget: 'ACCOUNTANT'
        });
    }
}

globalEventBus.subscribe(SystemEvents.PAYMENT_RECEIVED, new PaymentReceivedHandler());
