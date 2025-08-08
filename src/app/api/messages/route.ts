import { NextResponse } from 'next/server';
import { getMessages } from '@/lib/database';

export async function GET() {
  try {
    const messages = await getMessages();
    return NextResponse.json({ messages, success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', success: false }, 
      { status: 500 }
    );
  }
}