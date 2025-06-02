
'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, Report } from '@/lib/types';
import { addChatMessage } from '@/lib/chat-store.ts';
// Removed: import { getReportByIdFromStorage } from '@/lib/report-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, UserCircle, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  chatId: string;
  reportId: string;
}

export default function ChatInterface({ chatId, reportId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    setErrorState(null);

    async function fetchReportDetailsAndInitializeChat() {
      if (!chatId || !reportId) {
        console.warn("ChatId or ReportId missing, cannot initialize chat.");
        setErrorState("Essential chat information is missing.");
        setIsLoading(false);
        return;
      }

      let loadedReport: Report | null = null;
      try {
        // Fetch report details first
        const reportResponse = await fetch(`/api/reports/${reportId}`);
        if (!reportResponse.ok) {
          const errorData = await reportResponse.json().catch(() => ({ error: "Failed to fetch report details" }));
          throw new Error(errorData.error || `Failed to fetch report details: ${reportResponse.statusText}`);
        }
        loadedReport = await reportResponse.json();
        
        if (!loadedReport || !loadedReport.id) { // Check if the response is a valid report object
            // The GET /api/reports/[reportId] currently returns a generic message if not found in memory
            // For a real app, it should return 404. We'll adapt to its current placeholder behavior.
            if (loadedReport && (loadedReport as any).message?.includes("Endpoint for report")) {
                 console.warn(`Report ${reportId} not found via API. The API might be returning a placeholder.`);
                 throw new Error(`Report with ID ${reportId} not found. Chat cannot be initialized.`);
            }
            throw new Error("Report details could not be loaded. Invalid data received.");
        }
        setReport(loadedReport);

        // Fetch chat messages
        const messagesResponse = await fetch(`/api/chat/${chatId}/messages`);
        if (!messagesResponse.ok) {
          const errorData = await messagesResponse.json().catch(() => ({ error: `Failed to fetch messages. Status: ${messagesResponse.status}` }));
          throw new Error(errorData.error || `Failed to fetch messages: ${messagesResponse.statusText}`);
        }
        let apiMessages: ChatMessage[] = await messagesResponse.json();

        if (apiMessages.length === 0 && loadedReport && loadedReport.assignedOfficerName) {
          const greetingPayload = {
            sender: 'officer' as 'officer',
            text: `Hello! I am ${loadedReport.assignedOfficerName}. I'm reviewing your report (ID: ${reportId}). How can I assist you further regarding this matter?`,
          };

          const greetingPostResponse = await fetch(`/api/chat/${chatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(greetingPayload),
          });

          if (!greetingPostResponse.ok) {
            const errorData = await greetingPostResponse.json().catch(() => ({ error: `Failed to post greeting. Status: ${greetingPostResponse.status}` }));
            throw new Error(errorData.error || `Failed to post initial officer greeting: ${greetingPostResponse.statusText}`);
          }
          const serverGeneratedGreeting: ChatMessage = await greetingPostResponse.json();
          apiMessages = [serverGeneratedGreeting];
          addChatMessage(chatId, serverGeneratedGreeting);
        }
        setMessages(apiMessages);

      } catch (error) {
        console.error("Failed to load/initialize chat:", error);
        const errorMessage = error instanceof Error ? error.message : "Could not load or initialize chat. Please try again.";
        setErrorState(errorMessage);
        toast({
          title: "Chat Initialization Error",
          description: errorMessage,
          variant: "destructive",
        });
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReportDetailsAndInitializeChat();

  }, [chatId, reportId, toast]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessageText.trim() === '') return;
    setIsSending(true);

    const messagePayload = {
      text: newMessageText.trim(),
      sender: 'user' as 'user',
    };

    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Message not sent. Status: ${response.status}` }));
        throw new Error(errorData.error || `Failed to send message: ${response.statusText}`);
      }

      const serverResponseMessage: ChatMessage = await response.json();
      
      addChatMessage(chatId, serverResponseMessage); 

      setMessages((prevMessages) => [...prevMessages, serverResponseMessage]);
      setNewMessageText('');

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not send message. Please try again.';
      toast({
        title: 'Error Sending Message',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="flex flex-1 justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading messages...</span></div>;
  }

  if (errorState) {
     return (
      <div className="flex flex-1 justify-center items-center text-destructive p-4 text-center">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>{errorState}</span>
      </div>
    );
  }
  
  if (!report) { 
    return (
      <div className="flex flex-1 justify-center items-center text-destructive p-4 text-center">
         <AlertTriangle className="h-8 w-8 mr-2" />
        Report details are unavailable. Chat cannot be displayed.
      </div>
    );
  }
  
  const officerName = report.assignedOfficerName || 'Assigned Officer';

  return (
    <Card className="flex flex-col flex-1 shadow-xl h-full max-h-[calc(100vh-12rem)]">
      <CardHeader className="border-b">
        <CardTitle className="text-xl flex items-center">
          <ShieldCheck className="mr-2 h-6 w-6 text-primary" />
          Chat with {officerName}
        </CardTitle>
         <p className="text-xs text-muted-foreground flex items-center mt-1">
          <AlertTriangle className="h-3 w-3 mr-1 text-yellow-500" />
          Prototype chat: Messages sent to a mock backend (in-memory) & stored locally. Not encrypted.
        </p>
      </CardHeader>
      <ScrollArea className="flex-1 p-4">
        <CardContent className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex flex-col p-3 rounded-lg max-w-[75%]',
                msg.sender === 'user'
                  ? 'bg-primary/10 self-end items-end'
                  : 'bg-muted self-start items-start'
              )}
            >
              <div className="flex items-center mb-1">
                {msg.sender === 'officer' ? (
                  <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                ) : (
                  <UserCircle className="h-5 w-5 mr-2 text-accent" />
                )}
                <span className="font-semibold text-sm">
                  {msg.sender === 'user' ? 'You' : officerName}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <span className="text-xs text-muted-foreground mt-1 self-end">
                {format(new Date(msg.timestamp), 'p, MMM d')}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
      </ScrollArea>
      <CardFooter className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex w-full items-center space-x-2"
        >
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            className="flex-1"
            aria-label="Chat message input"
            disabled={isSending || !!errorState}
          />
          <Button type="submit" size="icon" disabled={!newMessageText.trim() || isSending || !!errorState}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

