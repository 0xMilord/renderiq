import { NextResponse } from 'next/server';

const deprecatedResponse = NextResponse.json(
  { success: false, error: 'chat_messages API has been removed' },
  { status: 410 },
);

export async function POST() {
  return deprecatedResponse;
}

export async function GET() {
  return deprecatedResponse;
}

