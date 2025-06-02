
import { NextResponse, type NextRequest } from 'next/server';
import type { ChatMessage } from '@/lib/types';

// In-memory store for chat messages (resets on server restart - for prototype purposes)
const chatMessagesStore: Map<string, ChatMessage[]> = new Map();

const MAX_CHAT_ID_LENGTH = 100; // Example constraint

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;

  if (!chatId || typeof chatId !== 'string' || chatId.trim() === '' || chatId.length > MAX_CHAT_ID_LENGTH) {
    return NextResponse.json({ error: 'Invalid or missing chatId' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error(`[API CHAT ${chatId}] Error parsing JSON body:`, error);
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

    console.log(`[API CHAT ${chatId}] Stored message. Total for chat: ${chatMessagesStore.get(chatId)!.length}`);
    return NextResponse.json(newMessage, { status: 201 });

  } catch (error) {
    console.error(`[API CHAT ${chatId}] Internal server error while posting message:`, error);
    return NextResponse.json({ error: 'Internal server error while processing your message.' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;

  if (!chatId || typeof chatId !== 'string' || chatId.trim() === '' || chatId.length > MAX_CHAT_ID_LENGTH) {
    return NextResponse.json({ error: 'Invalid or missing chatId' }, { status: 400 });
  }

  try {
    const messages = chatMessagesStore.get(chatId) || [];
    console.log(`[API CHAT ${chatId}] Retrieved ${messages.length} messages.`);
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error(`[API CHAT ${chatId}] Internal server error while getting messages:`, error);
    return NextResponse.json({ error: 'Internal server error while retrieving messages.' }, { status: 500 });
  }
}
