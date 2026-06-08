import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ data: [], message: 'Migrated to V4 Bounded Contexts. See projects API.' });
}

export async function POST() {
  return NextResponse.json({ error: 'Endpoint migrated to V4.' }, { status: 501 });
}
