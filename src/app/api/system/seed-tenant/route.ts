import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'Seed logic migrated to V4 Enterprise structures.' });
}
