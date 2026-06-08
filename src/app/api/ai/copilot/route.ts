import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Endpoint migrated to V4.' }, { status: 501 });
}
