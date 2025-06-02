
import ChatInterface from '@/components/chat-interface';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function ChatPage({ params, searchParams }: { params: { chatId: string }, searchParams: { reportId?: string } }) {
  const chatId = params.chatId;
  const reportId = searchParams.reportId;

  if (!reportId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Error: Report ID missing</h1>
        <p className="text-muted-foreground">Cannot initiate chat without a report ID.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-var(--header-height,10rem))] flex flex-col">
      <Suspense fallback={
          <div className="flex flex-1 justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
            <span className="ml-2">Loading chat...</span>
          </div>
        }>
        <ChatInterface chatId={chatId} reportId={reportId} />
      </Suspense>
    </div>
  );
}
