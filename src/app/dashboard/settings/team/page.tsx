import { redirect } from 'next/navigation'
import { TeamManagementClient } from '@/modules/settings/components/TeamManagementClient'
import { withPageEEK } from '@/eek/withPageEEK'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default withPageEEK({
  resource: 'settings',
  action: 'read',
  handler: async (ctx) => {
    if (ctx.session.role !== 'owner' && ctx.session.role !== 'manager') {
      redirect('/dashboard/settings')
    }

    const profilesList = await ctx.db.select().from(profiles).where(eq(profiles.organizationId, ctx.organizationId));

    const mappedProfiles = profilesList.map((p: any) => ({
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
