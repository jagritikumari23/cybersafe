
import { NextResponse, type NextRequest } from 'next/server';
import type { ChatMessage } from '@/lib/types';

// In a real application, you would store messages in a database.
// For this prototype, we'll just simulate it. We could use a temporary in-memory store
// or even write to a file for simple persistence across server restarts if needed,
// but for now, we'll just echo back and rely on client-side localStorage for display.

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, sender } = body;

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Message text is required and must be a string' }, { status: 400 });
  }
  if (sender !== 'user' && sender !== 'officer') {
     return NextResponse.json({ error: 'Invalid sender type' }, { status: 400 });
  }

  const newMessage: ChatMessage = {
    id: `server-msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    chatId,
    sender,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };

  // Here you would typically save the newMessage to your database.
  // For this example, we're just returning it.
  console.log(`[API] Received message for chat ${chatId}:`, newMessage);

  return NextResponse.json(newMessage, { status: 201 });
}
