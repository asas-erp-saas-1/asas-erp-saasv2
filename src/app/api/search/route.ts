import { NextRequest, NextResponse } from 'next/server';
import { kernel } from '@/lib/kernel/core';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const filters = { q: q.toLowerCase() };
    const limit = 5;

    // Fetch from all major tables
    const [leads, clients, properties, deals] = await Promise.all([
      kernel.query<any>('leads', { filters, limit }),
      kernel.query<any>('clients', { filters, limit }),
      kernel.query<any>('properties', { filters, limit }),
      kernel.query<any>('deals', { filters, limit })
    ]);

    const results = [];

    // Map Leads
    for (const item of (leads || [])) {
      results.push({
        id: item.id,
        type: 'lead',
        title: item.full_name,
        subtitle: `Phone: ${item.phone} | Status: ${item.status}`,
        url: `/dashboard/leads?id=${item.id}`,
      });
    }

    // Map Clients
    for (const item of (clients || [])) {
      results.push({
        id: item.id,
        type: 'client',
        title: item.full_name,
        subtitle: `Phone: ${item.phone} | Type: ${item.type}`,
        url: `/dashboard/clients?q=${item.phone}`,
      });
    }

    // Map Properties
    for (const item of (properties || [])) {
      results.push({
        id: item.id,
        type: 'property',
        title: item.reference_code,
        subtitle: `Type: ${item.type} | Surface: ${item.area_sqm}m²`,
        url: `/dashboard/properties`,
      });
    }

    // Map Deals
    for (const item of (deals || [])) {
      results.push({
        id: item.id,
        type: 'deal',
        title: `Transaction ID: ${item.id.slice(0, 8)}`,
        subtitle: `Status: ${item.status}`,
        url: `/dashboard/deals`,
      });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
