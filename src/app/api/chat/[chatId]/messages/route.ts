
import { NextResponse, type NextRequest } from 'next/server';
import type { ChatMessage } from '@/lib/types';

// In-memory store for chat messages (resets on server restart - for prototype purposes)
const chatMessagesStore: Map<string, ChatMessage[]> = new Map();

const MAX_CHAT_ID_LENGTH = 100; // Example constraint

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;

  if (!chatId || typeof chatId !== 'string' || chatId.trim() === '' || chatId.length > MAX_CHAT_ID_LENGTH) {
    return NextResponse.json({ error: 'Invalid or missing chatId' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, sender } = body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return NextResponse.json({ error: 'Message text is required and must be a non-empty string' }, { status: 400 });
  }
  if (sender !== 'user' && sender !== 'officer') {
     return NextResponse.json({ error: 'Invalid sender type. Must be "user" or "officer".' }, { status: 400 });
  }

  try {
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

    return NextResponse.json(newMessage, { status: 201 });

  } catch {
    return NextResponse.json({ error: 'Internal server error while processing your message.' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;

  if (!chatId || typeof chatId !== 'string' || chatId.trim() === '' || chatId.length > MAX_CHAT_ID_LENGTH) {
    return NextResponse.json({ error: 'Invalid or missing chatId' }, { status: 400 });
  }

  try {
    const messages = chatMessagesStore.get(chatId) || [];
    return NextResponse.json(messages, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error while retrieving messages.' }, { status: 500 });
  }
}
