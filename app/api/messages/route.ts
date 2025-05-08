// app/api/messages/route.ts
import getRedisClient from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

const MESSAGES_KEY = 'guestbook_messages'; // Key for our Redis list

// GET handler to fetch messages
export async function GET() {
  try {
    const redis = getRedisClient();
    // LRANGE returns messages from newest to oldest if using LPUSH
    // Or oldest to newest if using RPUSH. Let's use LPUSH for newest first.
    const messages = await redis.lrange(MESSAGES_KEY, 0, -1); // Get all messages
    return NextResponse.json(messages.map(msg => JSON.parse(msg)));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST handler to add a new message
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    if (text.length > 200) { // Basic validation
        return NextResponse.json({ error: 'Message too long (max 200 chars)' }, { status: 400 });
    }

    const redis = getRedisClient();
    const newMessage = {
      text: text.trim(),
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9), // Simple unique ID
    };

    // LPUSH adds to the beginning of the list (newest first)
    await redis.lpush(MESSAGES_KEY, JSON.stringify(newMessage));
    // Optional: Trim the list if it gets too long
    // await redis.ltrim(MESSAGES_KEY, 0, 99); // Keep only the latest 100 messages

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error posting message:', error);
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  }
}