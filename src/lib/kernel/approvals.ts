// src/lib/kernel/approvals.ts

import { AggregateRoot, SystemEvent, globalEventBus, SystemEvents } from './core';

export type ApprovalState = 'REQUESTED' | 'APPROVED' | 'REJECTED';
export type StepState = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';

export interface ApprovalStep {
    order: number;
    requiredRole: string;
    status: StepState;
}

export class ApprovalChainAggregate extends AggregateRoot<{ 
    targetType: string, 
    targetId: string, 
    domain: string,
    status: ApprovalState, 
    steps: ApprovalStep[] 
}> {
    
    approveStep(order: number, userId: string, userRole: string, comments?: string) {
        if (this.state.status !== 'REQUESTED') throw new Error("Chain is closed.");
        
        const step = this.state.steps.find(s => s.order === order);
        if (!step) throw new Error("Step not found");
        if (step.status !== 'PENDING') throw new Error("Step already acted upon");
        if (step.requiredRole !== userRole && userRole !== 'CEO') throw new Error("Unauthorized to approve this step");

        // CEO override logic could go here
        
        this.applyChange({
            id: crypto.randomUUID(),
            eventType: 'ApprovalStepApproved',
            aggregateType: 'ApprovalChain',
            aggregateId: this.id,
            sourceModule: 'Approvals',
            payload: { order, comments, approvedByRole: userRole },
            createdAt: new Date(),
            createdBy: userId
        });

        // Determine if chain is fully approved
        const allApproved = this.state.steps.every(s => 
            s.order === order ? true : s.status === 'APPROVED' || s.status === 'SKIPPED'
        );

        if (allApproved) {
            this.applyChange({
                id: crypto.randomUUID(),
                eventType: SystemEvents.APPROVAL_GRANTED,
                aggregateType: 'ApprovalChain',
                aggregateId: this.id,
                sourceModule: 'Approvals',
                payload: { targetType: this.state.targetType, targetId: this.state.targetId, domain: this.state.domain },
                createdAt: new Date(),
                createdBy: 'SYSTEM'
            });
        }
    }

    protected mutate(event: SystemEvent): void {
        if (event.eventType === 'ApprovalStepApproved') {
            const step = this.state.steps.find(s => s.order === event.payload.order);
            if (step) step.status = 'APPROVED';
        } else if (event.eventType === SystemEvents.APPROVAL_GRANTED) {
            this.state.status = 'APPROVED';
        }
    }
}
