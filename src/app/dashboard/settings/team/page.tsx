import { redirect } from 'next/navigation'
import { TeamManagementClient } from '@/modules/settings/components/TeamManagementClient'
import { withPageEEK } from '@/eek/withPageEEK'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default withPageEEK({
  resource: 'settings',
  action: 'read',
  handler: async (ctx) => {
    if (ctx.session.role !== 'owner' && ctx.session.role !== 'manager') {
      redirect('/dashboard/settings')
    }

    const usersList = await ctx.db.select().from(users).where(eq(users.organizationId, ctx.organizationId));

    const mappedProfiles = usersList.map((p: any) => ({
      id: p.id,
      full_name: [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown',
      email: p.email || '',
      role: p.role || 'agent',
      status: p.status || 'active',
      last_active: p.lastActive || null
    }))

    return <TeamManagementClient initialProfiles={mappedProfiles} currentUserRole={ctx.session.role} />
  }
})
