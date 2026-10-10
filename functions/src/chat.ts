import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

export const processChatMessage = onDocumentCreated(
  'chats/{chatId}/messages/{messageId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data associated with the event');
      return;
    }

    const message = snapshot.data();
    const chatId = event.params.chatId;

    // Only process non-AI messages
    if (message.senderRole === 'ai') return;

    // TODO: Implement AI response logic
    const aiResponse = {
      content: 'Thank you for your message. An officer will respond shortly.',
      senderId: 'ai-assistant',
      senderName: 'AI Assistant',
      senderRole: 'ai',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        isSystemMessage: true
      }
    };

    // Add AI response to the chat
    return admin.firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add(aiResponse);
  }
);
