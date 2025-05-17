
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ChatMessage, Report } from '@/lib/types';
import { getChatMessages, addChatMessage } from '@/lib/chat-store';
import { getReportByIdFromStorage } from '@/lib/report-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, UserCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  chatId: string;
  reportId: string;
}

export default function ChatInterface({ chatId, reportId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    const loadedReport = getReportByIdFromStorage(reportId);
    setReport(loadedReport);

    const loadedMessages = getChatMessages(chatId);
    if (loadedMessages.length === 0 && loadedReport?.assignedOfficerName) {
      // Add initial officer greeting if chat is new
      const officerGreeting = addChatMessage(chatId, {
        sender: 'officer',
        text: `Hello! I am ${loadedReport.assignedOfficerName}. I'm reviewing your report (ID: ${reportId}). How can I assist you further regarding this matter?`,
      });
      setMessages([officerGreeting]);
    } else {
      setMessages(loadedMessages);
    }
    setIsLoading(false);
  }, [chatId, reportId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    const sentMessage = addChatMessage(chatId, {
      sender: 'user',
      text: newMessage.trim(),
    });
    setMessages((prevMessages) => [...prevMessages, sentMessage]);
    setNewMessage('');
  };

  if (isLoading) {
    return <div className="flex flex-1 justify-center items-center"><Send className="h-8 w-8 animate-pulse text-primary" /> <span className="ml-2">Loading messages...</span></div>;
  }

  if (!report) {
    return <div className="text-center text-destructive">Report details not found. Cannot initiate chat.</div>;
  }
  
  const officerName = report.assignedOfficerName || 'Assigned Officer';

  return (
    <Card className="flex flex-col flex-1 shadow-xl h-full max-h-[calc(100vh-12rem)]"> {/* Adjust max-h based on layout */}
      <CardHeader className="border-b">
        <CardTitle className="text-xl flex items-center">
          <ShieldCheck className="mr-2 h-6 w-6 text-primary" />
          Chat with {officerName}
        </CardTitle>
         <p className="text-xs text-muted-foreground flex items-center mt-1">
          <AlertTriangle className="h-3 w-3 mr-1 text-yellow-500" />
          Prototype chat: Messages are stored locally, not encrypted or sent to a real officer.
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
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            aria-label="Chat message input"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
