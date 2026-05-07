import { z } from 'zod';

export const DealStatusEnum = z.enum([
  'prospecting',
  'negotiating',
  'closed_won',
  'closed_lost'
]);

export type DealStatus = z.infer<typeof DealStatusEnum>;

// Core Entity Contract
export const DealSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  version: z.number().int().min(1),
  status: DealStatusEnum,
  agreedPrice: z.number().min(0),
  // Strict property boundaries
  ownerId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Deal = z.infer<typeof DealSchema>;

// Input DTO Contract
export const SetDealStagePayloadSchema = z.object({
  stage: DealStatusEnum,
  notes: z.string().optional()
});

export type SetDealStagePayload = z.infer<typeof SetDealStagePayloadSchema>;

// Outbox Event Envelope Contract
export const DomainEventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  aggregateId: z.string().uuid(),
  type: z.string(),
  version: z.number().int().min(1),
  payload: z.record(z.string(), z.unknown()),
  traceId: z.string(),
  createdAt: z.string().datetime()
});

export type DomainEventEnvelope = z.infer<typeof DomainEventEnvelopeSchema>;
