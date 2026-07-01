import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export interface AuditEvent {
  organizationId: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
}

export class AuditService {
  constructor(private requestId: string) {}

  // Async log to not block the main execution
  logAudit(event: AuditEvent) {
    // In production, this goes to an async queue like Redis/QStash
    // For now, we fire and forget the DB insert
    db.insert(auditLogs)
      .values({
        organizationId: event.organizationId,
        userId: event.userId,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        oldData: event.oldData,
        newData: event.newData,
        ipAddress: event.ipAddress,
      })
      .execute()
      .catch((err) => {
        console.error(`[AUDIT FAILED] RequestId: ${this.requestId}`, err);
      });
  }
}
