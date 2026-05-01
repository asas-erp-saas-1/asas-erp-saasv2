import { NextResponse } from 'next/server';
import { LeadService } from '@/services/leads/lead.service';

export async function GET(request: Request) {
  try {
    const leads = await LeadService.getLeads();
    return NextResponse.json({ data: leads, count: leads.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}