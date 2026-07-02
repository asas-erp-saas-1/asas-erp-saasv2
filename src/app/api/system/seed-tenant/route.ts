import { withEEK } from '@/eek/withEEK';
import { NextResponse } from 'next/server';
import { organizations, roles, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export const POST = withEEK({
  resource: 'system',
  action: 'write',
  handler: async (ctx, request: Request) => {
  try {
    // 1. Create Organization
    let org = await ctx.db.select().from(organizations).where(eq(organizations.slug, 'asas_holdings')).limit(1);
    
    if (org.length === 0) {
       org = await ctx.db.insert(organizations).values({
         name: 'ASAS Holdings',
         slug: 'asas_holdings',
         plan: 'enterprise'
       }).returning();
    }

    const orgData = org[0];
    if (!orgData) throw new Error("Failed to create org");
    const orgId = orgData.id;

    // 2. Create Roles
    let adminRole = await ctx.db.select().from(roles).where(eq(roles.name, 'Super Admin')).limit(1);
    
    if (adminRole.length === 0) {
       adminRole = await ctx.db.insert(roles).values({
         organizationId: orgId,
         name: 'Super Admin',
         permissions: ['*:*']
       }).returning();
    }

    const roleData = adminRole[0];
    if (!roleData) throw new Error("Failed to create role");
    const roleId = roleData.id;

    // 3. Create initial Admin User
    let adminUser = await ctx.db.select().from(users).where(eq(users.email, 'admin@asas.dz')).limit(1);

    if (adminUser.length === 0) {
       adminUser = await ctx.db.insert(users).values({
         organizationId: orgId,
         email: 'admin@asas.dz',
         name: 'Karim System Admin',
         roleId: roleId,
         role: 'admin',
         department: 'IT & Security'
       }).returning();
    }

    // 4. Fallback updating old unassigned data to this organization
    // ... just an example
    
    return NextResponse.json({ 
       message: 'Enterprise tenants and RBAC seeded.',
       organization: org[0],
       role: adminRole[0],
       user: adminUser[0]
    });

  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'Seed Tenant API' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
});
