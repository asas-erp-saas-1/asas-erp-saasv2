import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'cash_position') {
      return NextResponse.json({
        totalCash: 125000000,
        available: 95000000,
        reserved: 30000000,
        lastUpdated: new Date().toISOString()
      });
    }

    if (view === 'aging') {
      return NextResponse.json({
        data: [
          { client: 'Atlas Corp', amount: 1500000, days: 15 },
          { client: 'Ziani Sarl', amount: 850000, days: 45 },
          { client: 'Invest Dz', amount: 4500000, days: 90 }
        ]
      });
    }

    return NextResponse.json({ error: 'Unsupported view' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
