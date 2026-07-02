import { withEEK } from '@/eek/withEEK';
import { NextResponse } from 'next/server';
import { jobCandidates, jobPostings } from '@/db/schema';
import { desc, eq, sql, and } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export const GET = withEEK({
  resource: 'system',
  action: 'read',
  handler: async (ctx, request: Request) => {
  try {
    
    const orgId = ctx.organizationId;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const candidatesResult = await ctx.db.select({
      id: jobCandidates.id,
      firstName: jobCandidates.firstName,
      lastName: jobCandidates.lastName,
      status: jobCandidates.status,
      score: jobCandidates.score,
      createdAt: jobCandidates.createdAt,
      jobPosting: {
         id: jobPostings.id,
         title: jobPostings.title,
      }
    })
    .from(jobCandidates)
    .leftJoin(jobPostings, eq(jobCandidates.jobPostingId, jobPostings.id))
    .where(eq(jobCandidates.organizationId, orgId))
    .orderBy(desc(jobCandidates.createdAt))
    .limit(limit);

    // Map data for front-end
    const formatted = candidatesResult.map(c => ({
       id: `CND-${c.id}`,
       name: `${c.firstName} ${c.lastName}`,
       role: c.jobPosting?.title || 'General Application',
       status: c.status,
       appliedAt: c.createdAt.toISOString().split('T')[0],
       score: c.score ? Number(c.score) : 0,
    }))

    // Count statistics
    const stats = await ctx.db.select({
       openRoles: sql`count(distinct ${jobPostings.id})`.mapWith(Number),
       activeCandidates: sql`count(${jobCandidates.id})`.mapWith(Number),
       interviews: sql`count(*) filter (where ${jobCandidates.status} = 'En entretien')`.mapWith(Number),
    }).from(jobCandidates)
      .leftJoin(jobPostings, eq(jobCandidates.jobPostingId, jobPostings.id))
      .where(eq(jobCandidates.organizationId, orgId));

    return NextResponse.json({ 
       data: formatted, 
       stats: stats[0] || { openRoles: 0, activeCandidates: 0, interviews: 0 } 
    });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/recruitment' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
});
