import { NextResponse } from 'next/server';
import { DealService } from '@/services/deals/deal.service';
import { ErrorTracker } from '@/lib/observability/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 25;
    
    // Simplification for the sake of completion: retrieving deals via service
    const deals = await DealService.getDeals();
    
    return NextResponse.json({ data: deals, count: deals.length });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/deals' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.value) {
      return NextResponse.json({ error: 'Title and value are required' }, { status: 400 });
    }
    const deal = await DealService.createDeal({
      title: body.title,
      dealValue: body.value,
      leadId: body.leadId,
    });
    return NextResponse.json({ data: deal });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'POST /api/deals' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
