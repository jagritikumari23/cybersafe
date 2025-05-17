
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

// This function now primarily serves to persist messages to localStorage for the prototype.
// The message object passed to it might already have server-generated id and timestamp.
export const addChatMessage = (
  chatId: string,
  messageData: Omit<ChatMessage, 'chatId'> & { chatId?: string } // Allow full ChatMessage to be passed
): ChatMessage => {
  if (typeof window === 'undefined') {
    const mockMessage: ChatMessage = {
      id: messageData.id || `server-mock-${Date.now()}`,
      timestamp: messageData.timestamp || new Date().toISOString(),
      sender: messageData.sender,
      text: messageData.text,
      chatId: chatId, // Ensure chatId is set correctly
    };
    console.warn("addChatMessage called in non-browser environment, returning mock message for chatId:", chatId);
    return mockMessage;
  }
  
  try {
    const messages = getChatMessages(chatId);
    
    // If a full ChatMessage object (potentially from server) is passed, use its properties.
    // Otherwise, generate id and timestamp if they are missing.
    const newMessage: ChatMessage = {
      id: messageData.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      chatId: chatId, // Always use the provided chatId for storage key consistency
      sender: messageData.sender,
      text: messageData.text,
      timestamp: messageData.timestamp || new Date().toISOString(),
    };

    // Avoid duplicates if message with same ID already exists (e.g. from server + local echo)
    const existingMessageIndex = messages.findIndex(m => m.id === newMessage.id);
    if (existingMessageIndex > -1) {
      messages[existingMessageIndex] = newMessage; // Update if exists
    } else {
      messages.push(newMessage);
    }
    
    localStorage.setItem(getChatStorageKey(chatId), JSON.stringify(messages));
    return newMessage;
  } catch (error) {
    console.error(`Error saving chat message for ${chatId} to localStorage:`, error);
    const fallbackMessage: ChatMessage = {
      id: messageData.id || `error-${Date.now()}`,
      chatId: chatId,
      sender: messageData.sender,
      text: messageData.text,
      timestamp: messageData.timestamp || new Date().toISOString(),
    };
    return fallbackMessage;
  }
};
