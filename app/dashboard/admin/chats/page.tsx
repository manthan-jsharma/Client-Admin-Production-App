'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  MessageSquare, Send, ShieldCheck, Sparkles, Paperclip,
  CheckCheck, Check, Bug, Zap, FolderKanban, Clock,
  Mic, Video, FileText, X, AlertTriangle, Circle, ExternalLink,
} from 'lucide-react';
import { ChatMessage, ChatAttachment } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

const POLL_INTERVAL_MS = 3000;

interface ChatThread {
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  clientAvatar: string | null;
  lastMessage: {
    message: string;
    senderName: string;
    senderRole: 'admin' | 'client' | 'ai';
    createdAt: Date;
  } | null;
  projectStatus: string;
  unreadCount?: number;
}

function formatTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function MessageRow({ msg, adminId }: { msg: ChatMessage; adminId: string }) {
  const isOwn = msg.senderId === adminId;
  const isAI = msg.senderRole === 'ai';
  const isRead = (msg.readBy ?? []).length > 1;

  return (
    <div className={`flex items-end gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isAI ? 'bg-gradient-to-br from-violet-600 to-purple-700' : 'bg-gradient-to-br from-slate-500 to-slate-700'
        }`}>
          {isAI ? <Sparkles className="w-3.5 h-3.5 text-white" /> : <span className="text-[10px] font-bold text-white">{initials(msg.senderName)}</span>}
        </div>
      )}

      <div className={`max-w-[68%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <span className="text-[10px] text-slate-600 mb-1 px-1">
          {isAI ? 'AI Assistant' : msg.senderName}
        </span>

        {/* Ticket card — clickable link to ticket panel */}
        {msg.type === 'ticket' && msg.ticket && (
          <Link
            href={`/dashboard/admin/requests`}
            className={`block rounded-xl border p-3 text-xs w-56 mb-1 transition-all hover:opacity-90 hover:shadow-md ${
              isOwn ? 'bg-blue-700/20 border-blue-500/20' : 'bg-amber-500/10 border-amber-500/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {msg.ticket.type === 'bug'
                ? <Bug className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                : <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
              <span className="font-semibold text-white truncate flex-1">{msg.ticket.title}</span>
              <ExternalLink className="w-3 h-3 text-slate-500 flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 capitalize">{msg.ticket.type.replace('_', ' ')}</span>
              <span className={`font-medium capitalize ${
                msg.ticket.status === 'resolved' ? 'text-emerald-400'
                : msg.ticket.status === 'in_progress' ? 'text-blue-400'
                : 'text-amber-400'
              }`}>{msg.ticket.status.replace('_', ' ')}</span>
            </div>
          </Link>
        )}

        {/* Text */}
        {msg.message && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm shadow-lg shadow-blue-600/20'
              : isAI
              ? 'bg-violet-600/15 border border-violet-500/20 text-violet-100 rounded-bl-sm'
              : 'bg-slate-700/80 text-slate-100 rounded-bl-sm'
          }`}>
            {msg.message.split(/(@AI\b)/gi).map((part, i) =>
              /^@AI$/i.test(part) ? <span key={i} className="text-violet-300 font-semibold">{part}</span> : part
            )}
          </div>
        )}

        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="mt-1 space-y-1">
            {msg.attachments.map((a, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${isOwn ? 'bg-blue-700/40 text-blue-100' : 'bg-slate-700/60 text-slate-300'}`}>
                {a.type === 'voice' ? <Mic className="w-3.5 h-3.5" /> : a.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                <span className="truncate max-w-[160px]">{a.filename}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-slate-600">{formatTime(msg.createdAt)}</span>
          {isOwn && (isRead ? <CheckCheck className="w-3 h-3 text-blue-400" /> : <Check className="w-3 h-3 text-slate-600" />)}
        </div>
      </div>
    </div>
  );
}

export default function AdminChatsPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (!selectedThread) return;
    loadMessages(selectedThread.projectId);
  }, [selectedThread?.projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [newMessage]);

  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/admin/chats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const result = await res.json();
      if (result.success) {
        setThreads(result.data);
        if (result.data.length > 0 && !selectedThread) setSelectedThread(result.data[0]);
      }
    } catch { /* ignore */ } finally {
      setIsLoadingThreads(false);
    }
  };

  const loadMessages = async (projectId: string) => {
    setIsLoadingMessages(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/chats?projectId=${projectId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const result = await res.json();
      if (result.success) {
        setMessages(result.data);
        setLastPollTime(new Date());
        markRead(projectId);
      }
    } catch { /* ignore */ } finally {
      setIsLoadingMessages(false);
    }
  };

  const poll = useCallback(async () => {
    if (!selectedThread) return;
    try {
      const since = lastPollTime.toISOString();
      const res = await fetch(`/api/chats?projectId=${selectedThread.projectId}&since=${since}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const result = await res.json();
      if (result.success && result.data.length > 0) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m._id));
          const fresh = result.data.filter((m: ChatMessage) => !ids.has(m._id));
          if (fresh.length === 0) return prev;
          markRead(selectedThread.projectId);
          setThreads(pt => pt.map(t =>
            t.projectId === selectedThread.projectId
              ? { ...t, lastMessage: { message: fresh[fresh.length - 1].message, senderName: fresh[fresh.length - 1].senderName, senderRole: fresh[fresh.length - 1].senderRole, createdAt: fresh[fresh.length - 1].createdAt } }
              : t
          ));
          return [...prev, ...fresh];
        });
        setLastPollTime(new Date());
      }
    } catch { /* ignore */ }
  }, [selectedThread, lastPollTime]);

  useEffect(() => {
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [poll]);

  const markRead = async (projectId: string) => {
    try {
      await fetch('/api/chats/read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });
      // Clear unread badge locally
      setThreads(prev => prev.map(t => t.projectId === projectId ? { ...t, unreadCount: 0 } : t));
    } catch { /* ignore */ }
  };

  const sendMessage = async () => {
    if (!selectedThread || (!newMessage.trim() && pendingAttachments.length === 0)) return;
    setIsSending(true);
    try {
      const body: Record<string, unknown> = {
        projectId: selectedThread.projectId,
        message: newMessage.trim() || '',
        type: pendingAttachments.length > 0 ? pendingAttachments[0].type : 'text',
      };
      if (pendingAttachments.length > 0) body.attachments = pendingAttachments;

      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        const newMsgs: ChatMessage[] = Array.isArray(result.data) ? result.data : [result.data];
        setMessages(prev => {
          const ids = new Set(prev.map(m => m._id));
          return [...prev, ...newMsgs.filter(m => !ids.has(m._id))];
        });
        setThreads(pt => pt.map(t =>
          t.projectId === selectedThread.projectId
            ? { ...t, lastMessage: { message: newMessage.trim(), senderName: user?.name ?? 'Admin', senderRole: 'admin', createdAt: new Date() } }
            : t
        ));
        setNewMessage('');
        setPendingAttachments([]);
        setLastPollTime(new Date());
      }
    } catch { /* ignore */ } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedThread) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('projectId', selectedThread.projectId);
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: fd,
      });
      const result = await res.json();
      if (result.success) setPendingAttachments(prev => [...prev, result.data]);
    } catch { /* ignore */ } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-8 pt-8 pb-6 border-b border-slate-800 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white">All Chat Threads</h1>
        <p className="text-sm text-slate-500 mt-1">{threads.length} project conversations · polling every 3s</p>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 133px)' }}>
        {/* Thread sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-slate-800 overflow-y-auto bg-slate-900/30">
          {isLoadingThreads ? (
            <div className="flex justify-center pt-10">
              <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {threads.map(thread => {
                const isSelected = selectedThread?.projectId === thread.projectId;
                return (
                  <button
                    key={thread.projectId}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      isSelected ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                          {thread.clientAvatar
                            ? <img src={thread.clientAvatar} alt={thread.clientName} className="w-9 h-9 rounded-full object-cover" />
                            : <span className="text-xs font-bold text-white">{initials(thread.clientName)}</span>}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-medium text-white truncate">{thread.clientName}</p>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                            {thread.lastMessage && (
                              <span className="text-[10px] text-slate-600">{formatTime(thread.lastMessage.createdAt)}</span>
                            )}
                            {(thread.unreadCount ?? 0) > 0 && (
                              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                                {(thread.unreadCount ?? 0) > 9 ? '9+' : thread.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <FolderKanban className="w-3 h-3 flex-shrink-0" />
                          {thread.projectName}
                        </p>
                        {thread.lastMessage && (
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">
                            {thread.lastMessage.senderRole === 'admin' ? 'You: ' : ''}{thread.lastMessage.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Message panel */}
        {selectedThread ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat header */}
            <div className="px-6 py-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-900/20">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                {selectedThread.clientAvatar
                  ? <img src={selectedThread.clientAvatar} alt={selectedThread.clientName} className="w-9 h-9 rounded-full object-cover" />
                  : <span className="text-xs font-bold text-white">{initials(selectedThread.clientName)}</span>}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{selectedThread.clientName}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <FolderKanban className="w-3 h-3" />
                  {selectedThread.projectName}
                  <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] capitalize">{selectedThread.projectStatus}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">Live</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isLoadingMessages ? (
                <div className="flex justify-center pt-10">
                  <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center pt-10">
                  <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No messages yet. Start the conversation.</p>
                </div>
              ) : (
                messages.map(msg => (
                  <MessageRow key={msg._id} msg={msg} adminId={user?._id ?? ''} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Pending attachments */}
            {pendingAttachments.length > 0 && (
              <div className="px-4 pt-2 flex gap-2 flex-wrap">
                {pendingAttachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-700/60 rounded-xl border border-slate-600/40 text-xs text-slate-300">
                    <FileText className="w-3 h-3" />
                    <span className="max-w-[120px] truncate">{a.filename}</span>
                    <button onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3 text-slate-500 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-slate-800">
              {newMessage.toLowerCase().includes('@ai') && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <p className="text-xs text-violet-400">AI will respond to this message</p>
                </div>
              )}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 hover:bg-slate-700 rounded-xl text-slate-500 hover:text-slate-300 transition-colors pb-3 disabled:opacity-40"
                >
                  {isUploading
                    ? <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                    : <Paperclip className="w-4 h-4" />}
                </button>
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Reply to ${selectedThread.clientName}…`}
                    rows={1}
                    disabled={isSending}
                    className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm leading-relaxed transition-all"
                    style={{ minHeight: '44px' }}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={isSending || (!newMessage.trim() && pendingAttachments.length === 0)}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center p-0 disabled:opacity-40 pb-1 flex-shrink-0"
                >
                  {isSending
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">Select a conversation</p>
              <p className="text-slate-600 text-sm mt-1">Choose a thread from the left to start chatting</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
