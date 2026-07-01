import { Session } from "./types";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ResourceAction = "read" | "write" | "delete" | "admin";

export async function requirePermission(session: Session, resource: string, action: ResourceAction) {
  if (!session.user.roleId) {
    throw new Error("FORBIDDEN: No role assigned");
  }

  // Basic cache structure could be implemented here using Redis
  // For now, fetch from DB
  const role = await db.query.roles.findFirst({
    where: eq(roles.id, session.user.roleId),
  });

  if (!role) {
    throw new Error("FORBIDDEN: Role not found");
  }

  const permissions = (role.permissions as string[]) || [];
  const requiredPermission = `${resource}:${action}`;
  const adminPermission = `${resource}:admin`;
  const superAdminPermission = `*:*`;

  const hasPermission = 
    permissions.includes(requiredPermission) || 
    permissions.includes(adminPermission) || 
    permissions.includes(superAdminPermission);

  if (!hasPermission) {
    throw new Error(`FORBIDDEN: Missing permission ${requiredPermission}`);
  }
}
