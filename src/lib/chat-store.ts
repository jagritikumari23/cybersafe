
'use client';
import type { ChatMessage } from './types';

const getChatStorageKey = (chatId: string) => `chatMessages_${chatId}`;

export const getChatMessages = (chatId: string): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const storedMessages = localStorage.getItem(getChatStorageKey(chatId));
    return storedMessages ? JSON.parse(storedMessages) : [];
  } catch (error) {
    console.error(`Error reading chat messages for ${chatId} from localStorage:`, error);
    return [];
  }
};

export const addChatMessage = (
  chatId: string,
  messageData: Omit<ChatMessage, 'id' | 'timestamp' | 'chatId'>
): ChatMessage => {
  if (typeof window === 'undefined') {
    // Return a mock message or throw error for server-side, though this should primarily be client-side
    const mockMessage: ChatMessage = {
      ...messageData,
      id: `server-mock-${Date.now()}`,
      timestamp: new Date().toISOString(),
      chatId,
    };
    console.warn("addChatMessage called in non-browser environment, returning mock message for chatId:", chatId);
    return mockMessage;
  }
  
  try {
    const messages = getChatMessages(chatId);
    const newMessage: ChatMessage = {
      ...messageData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      chatId,
    };
    messages.push(newMessage);
    localStorage.setItem(getChatStorageKey(chatId), JSON.stringify(messages));
    return newMessage;
  } catch (error) {
    console.error(`Error saving chat message for ${chatId} to localStorage:`, error);
    // Fallback or re-throw, here we'll return the message without saving if storage fails
     const fallbackMessage: ChatMessage = {
      ...messageData,
      id: `error-${Date.now()}`,
      timestamp: new Date().toISOString(),
      chatId,
    };
    return fallbackMessage;
  }
};
