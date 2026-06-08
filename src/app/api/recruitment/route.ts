import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ data: [], message: 'Migrated to V4 Bounded Contexts.' });
}
