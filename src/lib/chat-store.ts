
'use client';
import type { ChatMessage } from './types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: {
        timestamp: 'asc',
      },
    });
    // Map Prisma model to ChatMessage type if necessary (assuming they are compatible)
    return messages as ChatMessage[];
  } catch (error) {
    console.error(`Error reading chat messages for ${chatId} from database:`, error);
    return [];
  }
};

export const addChatMessage = async (
  chatId: string,
  messageData: Omit<ChatMessage, 'chatId'>
): Promise<ChatMessage | null> => {
  try {
    const newMessage = await prisma.chatMessage.create({
      data: {
        ...messageData,
        chatId,
        // Ensure timestamp is a Date object if your schema expects it
        timestamp: new Date(messageData.timestamp),
      },
    });
    // Map Prisma model to ChatMessage type if necessary
    return newMessage;
  } catch (error) {
    console.error(`Error saving chat message for ${chatId} to database:`, error);
    return null;
  }
};
