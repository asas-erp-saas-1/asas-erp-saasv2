import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, properties, leads, deals } from '@/db/schema';
import { eq, or, ilike, and, lte, gte } from 'drizzle-orm';
import { kernel } from '@/lib/kernel/core';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const identity = await kernel.identity();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: any[] = [];
    const lowerQ = `%${q.toLowerCase()}%`;
    const tenantCondition = eq(clients.organizationId, identity.tenantId);

    // AI Semantic Extraction (Wave 8 Intelligence)
    let aiParsedFilters: any = null;
    let isSemanticQuery = q.split(' ').length > 2; // if more than 2 words, probably conversational
    
    if (isSemanticQuery && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Extract real estate search filters from this query: "${q}". 
Return ONLY JSON with this format: {"isPropertySearch": boolean, "location": string|null, "maxPrice": number|null, "propertyType": string|null (e.g. 'apartment', 'villa')}. 
If it's not a property search, set isPropertySearch false. No markdown blocks.`,
        });
        const text = response.text || '';
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        aiParsedFilters = JSON.parse(cleanText);
      } catch (err) {
        console.warn('Semantic search extraction failed, falling back to lexical search');
      }
    }

    if (aiParsedFilters && aiParsedFilters.isPropertySearch) {
       // Semantic Property Search
       const propertyConditions = [eq(properties.organizationId, identity.tenantId)];
       
       if (aiParsedFilters.location) {
         propertyConditions.push(ilike(properties.location, `%${aiParsedFilters.location}%`));
       }
       if (aiParsedFilters.maxPrice) {
         propertyConditions.push(lte(properties.price, aiParsedFilters.maxPrice.toString()));
       }
       if (aiParsedFilters.propertyType) {
         propertyConditions.push(ilike(properties.type, `%${aiParsedFilters.propertyType}%`));
       }

       const matchedProps = await db.select().from(properties).where(and(...propertyConditions)).limit(10);
       for (const item of matchedProps) {
         results.push({
           id: item.id,
           type: 'property',
           title: `[AI] ${item.title} - ${item.location || 'Unknown'}`,
           subtitle: `Prix: ${item.price} DZD | Type: ${item.type}`,
           url: `/dashboard/properties`,
         });
       }
       
       // Since the user asked specifically about properties, return just these.
       return NextResponse.json({ results });
    }

    // Standard Lexical Search
    const [fetchedClients, fetchedProperties, fetchedLeads] = await Promise.all([
      db.select().from(clients).where(and(tenantCondition, or(ilike(clients.firstName, lowerQ), ilike(clients.lastName, lowerQ), ilike(clients.phone, lowerQ), ilike(clients.email, lowerQ)))).limit(5),
      db.select().from(properties).where(and(eq(properties.organizationId, Number(identity.tenantId)), or(ilike(properties.title, lowerQ), ilike(properties.location, lowerQ)))).limit(5),
      db.select().from(leads).where(and(eq(leads.organizationId, Number(identity.tenantId)), ilike(leads.status, lowerQ))).limit(5)
    ]);

    for (const item of fetchedClients) {
      results.push({
        id: item.id,
        type: 'client',
        title: `${item.firstName} ${item.lastName}`,
        subtitle: `Téléphone: ${item.phone || 'N/A'} | Email: ${item.email || 'N/A'}`,
        url: `/dashboard/clients?q=${item.phone}`,
      });
    }

    for (const item of fetchedProperties) {
      results.push({
        id: item.id,
        type: 'property',
        title: item.title,
        subtitle: `Location: ${item.location || 'N/A'} | Prix: ${item.price} DZD`,
        url: `/dashboard/properties`,
      });
    }

    for (const item of fetchedLeads) {
      results.push({
        id: item.id,
        type: 'lead',
        title: `Prospect ID: ${item.id}`,
        subtitle: `Status: ${item.status}`,
        url: `/dashboard/leads?id=${item.id}`,
      });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
