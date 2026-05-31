// src/domains/legal/module.ts

import { SystemEvent, EventHandler, AggregateRoot, globalEventBus } from '@/lib/kernel/core';
import { inboxEngine } from '@/lib/kernel/inbox';

export const LegalSystemEvents = {
    CONTRACT_GENERATED: 'ContractGenerated',
    NOTARY_REVIEW_REQUESTED: 'NotaryReviewRequested',
    NOTARY_SIGNED: 'NotarySigned',
};

export type ContractState = 'DRAFT' | 'PENDING_NOTARY' | 'SIGNED' | 'CANCELED';

export class ContractAggregate extends AggregateRoot<{ status: ContractState, dealId: string }> {
    
    requestNotaryReview(notaryId: string, userId: string) {
        if (this.state.status !== 'DRAFT') throw new Error("Can only request notary for DRAFT contracts.");

        this.applyChange({
            id: crypto.randomUUID(),
            eventType: LegalSystemEvents.NOTARY_REVIEW_REQUESTED,
            aggregateType: 'Contract',
            aggregateId: this.id,
            sourceModule: 'Legal',
            payload: { notaryId },
            createdAt: new Date(),
            createdBy: userId
        });
    }

    protected mutate(event: SystemEvent): void {
        if (event.eventType === LegalSystemEvents.NOTARY_REVIEW_REQUESTED) {
            this.state.status = 'PENDING_NOTARY';
        } else if (event.eventType === LegalSystemEvents.NOTARY_SIGNED) {
            this.state.status = 'SIGNED';
        }
    }
}

export class NotaryReviewRequestedHandler implements EventHandler {
    async handle(event: SystemEvent): Promise<void> {
        console.log(`[LEGAL DOMAIN] NotaryReviewRequested for Contract ${event.aggregateId}`);
        
        await inboxEngine.generateTask({
            taskType: 'NOTARY_APPOINTMENT',
            title: `Schedule Notary Appointment for Contract ${event.aggregateId}`,
            priority: 'HIGH',
            status: 'PENDING',
            domain: 'Legal',
            referenceAggregateType: 'Contract',
            referenceAggregateId: event.aggregateId,
            roleTarget: 'LEGAL_OFFICER'
        });
    }
}

globalEventBus.subscribe(LegalSystemEvents.NOTARY_REVIEW_REQUESTED, new NotaryReviewRequestedHandler());
