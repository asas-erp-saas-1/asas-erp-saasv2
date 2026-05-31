// src/domains/crm/module.ts

import { SystemEvent, EventHandler, CommandHandler, Command, AggregateRoot, globalEventBus, SystemEvents } from '@/lib/kernel/core';
import { inboxEngine } from '@/lib/kernel/inbox';

// ----- STATE MACHINE -----
export type DealState = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'CONTRACT_PENDING' | 'CLOSED_WON' | 'CANCELLED';

// ----- AGGREGATE -----
export class DealAggregate extends AggregateRoot<{ status: DealState, unitId: string, clientId: string, amount: number, discountPercentage: number }> {
    
    requestDiscount(discount: number, requestedBy: string) {
        if (this.state.status !== 'DRAFT') throw new Error("Cannot request discount unless deal is in DRAFT.");
        
        const event: SystemEvent = {
            id: crypto.randomUUID(),
            eventType: SystemEvents.DEAL_DISCOUNT_REQUESTED,
            aggregateType: 'Deal',
            aggregateId: this.id,
            sourceModule: 'CRM',
            payload: { discountPercentage: discount },
            createdAt: new Date(),
            createdBy: requestedBy
        };

        this.applyChange(event);
    }

    protected mutate(event: SystemEvent): void {
        switch (event.eventType) {
            case SystemEvents.DEAL_DISCOUNT_REQUESTED:
                this.state.status = 'PENDING_APPROVAL';
                this.state.discountPercentage = event.payload.discountPercentage;
                break;
            case SystemEvents.DEAL_APPROVED:
                this.state.status = 'APPROVED';
                break;
        }
    }
}

// ----- COMMANDS & HANDLERS -----

export interface RequestDiscountCommand extends Command {
    type: 'RequestDiscount';
    payload: {
        dealId: string;
        discountPercentage: number;
    }
}

export class RequestDiscountCommandHandler implements CommandHandler<RequestDiscountCommand> {
    async execute(command: RequestDiscountCommand): Promise<void> {
        // 1. Rehydrate Aggregate
        // const deal = await dealRepository.findById(command.payload.dealId);
        const deal = new DealAggregate(command.payload.dealId, { status: 'DRAFT', unitId: 'u1', clientId: 'c1', amount: 10000000, discountPercentage: 0 }); // Mock load
        
        // 2. Execute Aggregate Logic
        deal.requestDiscount(command.payload.discountPercentage, command.userId);
        
        // 3. Persist and Publish Events
        for (const event of deal.getUncommittedEvents()) {
            await globalEventBus.publish(event);
        }
        deal.markChangesAsCommitted();
    }
}

// ----- DOMAIN EVENT HANDLERS -----
export class DealDiscountRequestedHandler implements EventHandler {
    async handle(event: SystemEvent): Promise<void> {
        const { discountPercentage } = event.payload;
        console.log(`[CRM DOMAIN] Handling DealDiscountRequested for Deal ${event.aggregateId}`);
        
        // Determine role target based on discount rules
        let role = 'SALES_MANAGER';
        if (discountPercentage > 10) {
            role = 'CEO';
        }

        await inboxEngine.generateTask({
            taskType: 'DISCOUNT_APPROVAL',
            title: `Approve ${discountPercentage}% discount on Deal ${event.aggregateId}`,
            priority: discountPercentage > 10 ? 'HIGH' : 'MEDIUM',
            status: 'PENDING',
            domain: 'CRM',
            referenceAggregateType: 'Deal',
            referenceAggregateId: event.aggregateId,
            roleTarget: role,
            payload: event.payload
        });
    }
}

// Subscribe Domain Event Handlers on module load
globalEventBus.subscribe(SystemEvents.DEAL_DISCOUNT_REQUESTED, new DealDiscountRequestedHandler());
