import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Simple billing mock for compilation & basic UI behavior
  return NextResponse.json({
    monthly_limit: 1000,
    current_usage: 245,
    active_users: 5
  });
}
