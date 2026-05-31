// src/domains/construction/module.ts

import { SystemEvent, EventHandler, AggregateRoot, globalEventBus, SystemEvents } from '@/lib/kernel/core';
import { inboxEngine } from '@/lib/kernel/inbox';

export type MilestoneState = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export class ConstructionMilestoneAggregate extends AggregateRoot<{ status: MilestoneState, projectId: string, name: string }> {

    complete(userId: string, notes: string) {
        if (this.state.status !== 'IN_PROGRESS') {
            throw new Error("Only in-progress milestones can be completed.");
        }

        const event: SystemEvent = {
            id: crypto.randomUUID(),
            eventType: SystemEvents.MILESTONE_COMPLETED,
            aggregateType: 'Milestone',
            aggregateId: this.id,
            sourceModule: 'Construction',
            payload: { notes },
            createdAt: new Date(),
            createdBy: userId
        };

        this.applyChange(event);
    }

    protected mutate(event: SystemEvent): void {
        if (event.eventType === SystemEvents.MILESTONE_COMPLETED) {
            this.state.status = 'COMPLETED';
        }
    }
}

// ----- DOMAIN EVENT HANDLERS -----
export class MilestoneCompletedHandler implements EventHandler {
    async handle(event: SystemEvent): Promise<void> {
        console.log(`[CONSTRUCTION DOMAIN] MilestoneCompleted ${event.aggregateId} handled.`);

        // 1. Notify Finance to release Contractor Payments (Integration Process)
        await inboxEngine.generateTask({
            taskType: 'CONTRACTOR_PAYMENT_RELEASE',
            title: `Release Payment for Completed Milestone ${event.aggregateId}`,
            priority: 'HIGH',
            status: 'PENDING',
            domain: 'Finance',
            referenceAggregateType: 'Milestone',
            referenceAggregateId: event.aggregateId,
            roleTarget: 'FINANCE_MANAGER'
        });

        // 2. Notify Clients linked to this phase (CRM projection update trigger)
    }
}

globalEventBus.subscribe(SystemEvents.MILESTONE_COMPLETED, new MilestoneCompletedHandler());
