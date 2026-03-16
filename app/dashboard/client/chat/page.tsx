'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { MessageSquare, Send, ShieldCheck } from 'lucide-react';

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
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const result = await response.json();
        if (result.success) setMessages(result.data);
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
        body: JSON.stringify({ message: newMessage, type: 'text' })
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Chat with Admin</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time messaging for your projects</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Admin Online</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden p-8 flex flex-col min-h-0">
        <Card className="flex-1 bg-slate-800/60 border-slate-700/50 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : messages.length > 0 ? (
              <>
                {messages.map((message) => {
                  const isAdmin = message.senderRole === 'admin';
                  return (
                    <div key={message._id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                      {isAdmin && (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center flex-shrink-0 mr-2.5 mt-auto mb-0.5">
                          <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`max-w-xs lg:max-w-md ${isAdmin ? 'items-start' : 'items-end'} flex flex-col`}>
                        <span className={`text-[11px] font-medium mb-1 ${isAdmin ? 'text-slate-500 ml-1' : 'text-slate-500 mr-1'}`}>
                          {message.senderName}
                        </span>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          isAdmin
                            ? 'bg-slate-700 text-slate-100 rounded-tl-sm'
                            : 'bg-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-600/20'
                        }`}>
                          {message.message}
                        </div>
                        <span className={`text-[10px] text-slate-600 mt-1 ${isAdmin ? 'ml-1' : 'mr-1'}`}>
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-blue-400" />
                </div>
                <p className="text-slate-400 font-medium text-sm">No messages yet</p>
                <p className="text-slate-600 text-xs">Start the conversation with your admin below</p>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-700/50 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-11"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 rounded-xl h-11 flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
