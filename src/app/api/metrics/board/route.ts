import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ data: null, message: 'Migrated to V4 Bounded Contexts.' });
}
