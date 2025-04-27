'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface FileData {
  content: string;
  language: string;
  lastModified?: Date | number;
}

interface ChatCodeInterfaceProps {
  currentFile: string | null;
  currentFileContent: string;
  projectFiles: Record<string, FileData>;
  projectName?: string;
  projectType?: string;
  projectDescription?: string;
  onApplyCode: (code: string) => void;
}

export default function ChatCodeInterface({
  currentFile,
  currentFileContent,
  projectFiles,
  projectName,
  projectType,
  projectDescription,
  onApplyCode
}: ChatCodeInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm your AI coding assistant. I can help you write code, modify existing code, or explain concepts. Just let me know what you need!",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Generate a message ID
    const messageId = Date.now().toString();

    // Add user message to the chat
    const userMessage: Message = {
      id: messageId,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare project context
      const projectContext = {
        name: projectName,
        type: projectType,
        description: projectDescription
      };

      // Call the API
      const response = await fetch('/api/chat-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          currentFile,
          currentFileContent,
          projectFiles,
          projectContext
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();

      // Add AI response to the chat
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: data.message,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMessage]);

      // If code content was extracted, show a button to apply it
      if (data.codeContent) {
        // Show toast notification
        toast({
          title: "Code generated",
          description: (
            <div className="flex flex-col gap-2">
              <p>The AI has generated code that you can apply to the current file.</p>
              <Button 
                variant="outline" 
                onClick={() => onApplyCode(data.codeContent)}
                className="bg-indigo-600 text-white hover:bg-indigo-700 self-start"
              >
                Apply Code
              </Button>
            </div>
          )
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      toast({
        title: "Error",
        description: "Failed to communicate with the AI. Please try again.",
        variant: "destructive"
      });

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "Sorry, I encountered an error processing your request. Please try again.",
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format code blocks in messages
  const formatMessage = (text: string) => {
    // Split the message by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract the code and language identifier (not currently used but kept for future enhancements)
        const match = part.match(/```(\w*)\s*([\s\S]*?)```/);
        const code = match ? match[2] : part.slice(3, -3);
        
        return (
          <div key={index} className="bg-zinc-800 rounded-md p-3 my-2 overflow-x-auto">
            <pre className="text-zinc-200 text-sm font-mono whitespace-pre-wrap">
              {code}
            </pre>
          </div>
        );
      } else {
        // Regular text
        return (
          <p key={index} className="whitespace-pre-wrap">
            {part}
          </p>
        );
      }
    });
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      <div className="bg-indigo-700 text-white p-2 text-sm font-medium flex justify-between items-center">
        <span>AI Code Assistant</span>
      </div>
      
      {/* Messages container */}
      <div className="flex-grow overflow-y-auto p-3 bg-zinc-50">
        <div className="flex flex-col space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg p-3 max-w-[80%] ${
                message.sender === 'user'
                  ? 'bg-indigo-600 text-white ml-auto'
                  : 'bg-white text-zinc-800 border border-zinc-200'
              }`}
            >
              {formatMessage(message.text)}
              <div
                className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-indigo-200' : 'text-zinc-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="bg-white text-zinc-800 border border-zinc-200 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span className="text-zinc-600 text-sm">Generating response...</span>
              </div>
            </div>
          )}
          
          <div ref={messageEndRef} />
        </div>
      </div>
      
      {/* Input area */}
      <div className="border-t p-3 bg-white">
        <div className="flex items-center space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about your code or request changes..."
            className="flex-grow"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !inputMessage.trim()}
            size="icon"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 