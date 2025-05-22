
'use client';
import type { ChatMessage } from './types';

// Helper to get all chat messages from localStorage
const getAllChats = (): Record<string, ChatMessage[]> => {
  if (typeof window === 'undefined') return {};
  try {
    const allChats = localStorage.getItem('cyberSafeAllChatMessages');
    return allChats ? JSON.parse(allChats) : {};
  } catch (error) {
    console.error("Error reading all chats from localStorage:", error);
    return {};
  }
};

// Helper to save all chat messages to localStorage
const saveAllChats = (allChats: Record<string, ChatMessage[]>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('cyberSafeAllChatMessages', JSON.stringify(allChats));
  } catch (error) {
    console.error("Error saving all chats to localStorage:", error);
  }
};

export const getChatMessages = (chatId: string): ChatMessage[] => {
  const allChats = getAllChats();
  return allChats[chatId] || [];
};

export const addChatMessage = (
  chatId: string,
  message: ChatMessage // Expect the full ChatMessage object, assuming ID is handled by caller or API
): void => {
  const allChats = getAllChats();
  if (!allChats[chatId]) {
    allChats[chatId] = [];
  }
  
  // Ensure message ID consistency; server-generated ID should be preferred.
  // If somehow a message arrives without an ID (e.g. purely local simulation before API call), generate one.
  const messageToStore: ChatMessage = {
    ...message,
    id: message.id || `local-msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };

  // Avoid duplicates if messages are added both optimistically and from API response
  const messageExists = allChats[chatId].some(m => m.id === messageToStore.id);
  if (!messageExists) {
    allChats[chatId].push(messageToStore);
    saveAllChats(allChats);
  } else {
    // If message with same ID exists, update it (e.g., if server confirmed a timestamp)
    allChats[chatId] = allChats[chatId].map(m => m.id === messageToStore.id ? messageToStore : m);
    saveAllChats(allChats);
  }
};
