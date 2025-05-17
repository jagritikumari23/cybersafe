
import { NextResponse, type NextRequest } from 'next/server';
import type { ChatMessage } from '@/lib/types';

// In-memory store for chat messages (resets on server restart - for prototype purposes)
const chatMessagesStore: Map<string, ChatMessage[]> = new Map();

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

  // Store in our server-side in-memory store
  if (!chatMessagesStore.has(chatId)) {
    chatMessagesStore.set(chatId, []);
  }
  chatMessagesStore.get(chatId)!.push(newMessage);

  console.log(`[API] Stored message for chat ${chatId}. Total messages in store for this chat: ${chatMessagesStore.get(chatId)!.length}`);

  return NextResponse.json(newMessage, { status: 201 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;

  const messages = chatMessagesStore.get(chatId) || [];
  console.log(`[API] Retrieved ${messages.length} messages for chat ${chatId}`);

  return NextResponse.json(messages, { status: 200 });
}
