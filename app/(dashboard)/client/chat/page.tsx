'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/chats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const result = await response.json();
        if (result.success) {
          setMessages(result.data);
        }
      } catch (error) {
        console.error('[v0] Failed to fetch messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          message: newMessage,
          type: 'text'
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessages([...messages, result.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('[v0] Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Chat with Admin</h1>
        <p className="text-slate-400">Real-time messaging for your projects</p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 p-8 flex flex-col">
        <Card className="bg-slate-800 border-slate-700 flex-1 flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length > 0 ? (
              <>
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.senderRole === 'admin' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.senderRole === 'admin'
                          ? 'bg-slate-700 text-slate-100'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 opacity-70">{message.senderName}</p>
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400 text-center">
                  <div className="mb-2 text-3xl">💬</div>
                  No messages yet. Start a conversation!
                </p>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-slate-700 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
              >
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
