import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { withEEK } from '@/eek/withEEK';
import { auditLogs, deals, projectRisks } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export const POST = withEEK({
  resource: 'deals', // Required to read deals for context
  action: 'read',
  handler: async (ctx, req: Request) => {
    try {
      const { prompt } = await req.json();

      if (!prompt) {
        return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
      }

      // Attempt to gather context from the environment using tenant-scoped db
      const recentDealsQuery = await ctx.db.select({
         ref: deals.reference,
         price: deals.agreedPrice,
         status: deals.status
      }).from(deals).where(eq(deals.organizationId, ctx.organizationId)).orderBy(desc(deals.createdAt)).limit(5);

      const recentRisksQuery = await ctx.db.select({
         type: projectRisks.type,
         severity: projectRisks.severity,
         status: projectRisks.status
      }).from(projectRisks).orderBy(desc(projectRisks.createdAt)).limit(5); // TODO: Add organizationId to projectRisks in schema to scope this properly

      const context = `
Current Enterprise Context:
- Recent Deals: ${JSON.stringify(recentDealsQuery)}
- Active Risks: ${JSON.stringify(recentRisksQuery)}
`;

      // Log the AI inquiry
      ctx.audit.logAudit({
         organizationId: ctx.organizationId,
         userId: ctx.session.user.id,
         action: 'AI_COPILOT_QUERY',
         entityType: 'ai',
         entityId: 'SYSTEM',
         newData: { prompt }
      });

      // Try executing AI
      if (process.env.GEMINI_API_KEY) {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const response = await ai.models.generateContent({
             model: 'gemini-3.5-flash',
             contents: [
               { role: 'user', parts: [{ text: `You are an AI Operational Copilot for a real estate enterprise. Analyze the business context and the user query to provide highly professional, actionable insights. Do not hallucinate data that isn't provided.\n\n${context}\n\nQuery: ${prompt}` }] }
             ]
          });

          return NextResponse.json({ reply: response.text });
      } else {
          // Fallback for missing AI keys during simulation
          return NextResponse.json({ 
              reply: `I see you are asking about: "${prompt}". \n\nLooking at recent data, there are ${recentDealsQuery.length} recent deals, with the latest status being ${recentDealsQuery[0]?.status || 'unknown'}. We currently have ${recentRisksQuery.length} tracked risks.`
          });
      }

    } catch (error: any) {
      ErrorTracker.captureError(error, { context: 'AI Copilot' });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
});
