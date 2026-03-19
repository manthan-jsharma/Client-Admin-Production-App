'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  MessageSquare, Send, ShieldCheck, Sparkles, Paperclip,
  CheckCheck, Check, Bug, Zap, FolderKanban, Clock,
  Mic, Video, FileText, X, AlertTriangle, Circle, ExternalLink, ArrowLeft,
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
    senderRole: 'admin' | 'client' | 'ai' | 'dev';
    createdAt: Date;
  } | null;
  projectStatus: string;
  unreadCount?: number;
}

const MENTION_OPTIONS = [
  { handle: '@AI',     label: 'AI Assistant', color: '#8b5cf6' },
  { handle: '@client', label: 'Client',       color: '#f59e0b' },
  { handle: '@dev',    label: 'Developer',    color: '#16a34a' },
];

function MentionPicker({ query, onSelect }: { query: string; onSelect: (handle: string) => void }) {
  const filtered = MENTION_OPTIONS.filter(o => o.handle.toLowerCase().startsWith('@' + query.toLowerCase()));
  if (filtered.length === 0) return null;
  return (
    <div className="absolute bottom-full mb-1 left-0 z-50 rounded-xl overflow-hidden"
      style={{ background: '#ffffff', border: '1px solid #DDE5EC', boxShadow: '0 8px 24px rgba(30,40,60,0.12)', minWidth: 180 }}>
      {filtered.map(opt => (
        <button key={opt.handle} onMouseDown={e => { e.preventDefault(); onSelect(opt.handle); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors" style={{ fontSize: 13 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <span style={{ fontWeight: 700, color: opt.color }}>{opt.handle}</span>
          <span style={{ color: '#5F6B76', fontSize: 11 }}>{opt.label}</span>
        </button>
      ))}
    </div>
  );
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
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={isAI
            ? { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }
            : { background: 'linear-gradient(135deg, #5F6B76, #475569)' }}
        >
          {isAI ? <Sparkles className="w-3.5 h-3.5 text-white" /> : <span className="text-[10px] font-bold text-white">{initials(msg.senderName)}</span>}
        </div>
      )}

      <div className={`max-w-[68%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <span className="inline-flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
          style={isAI
            ? { background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }
            : msg.senderRole === 'client'
            ? { background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' }
            : msg.senderRole === 'dev'
            ? { background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0' }
            : { background: '#eff8ff', color: '#3A8DDE', border: '1px solid #c8dff0' }
          }>
          {isAI ? 'AI' : msg.senderRole === 'client' ? 'Client' : msg.senderRole === 'dev' ? 'Dev' : 'Admin'}
        </span>

        {/* Ticket card — clickable link to ticket panel */}
        {msg.type === 'ticket' && msg.ticket && (
          <Link
            href={`/dashboard/admin/requests`}
            className="block rounded-xl border p-3 text-xs w-56 mb-1 transition-all hover:opacity-90 hover:shadow-md"
            style={isOwn
              ? { background: '#eff8ff', border: '1px solid #c8dff0' }
              : { background: '#fffbeb', border: '1px solid #fde68a' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {msg.ticket.type === 'bug'
                ? <Bug className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                : <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#f59e0b' }} />}
              <span className="font-semibold truncate flex-1" style={{ color: '#1E2A32' }}>{msg.ticket.title}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" style={{ color: '#8A97A3' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="capitalize" style={{ color: '#8A97A3' }}>{msg.ticket.type.replace('_', ' ')}</span>
              <span
                className="font-medium capitalize"
                style={{ color: msg.ticket.status === 'resolved' ? '#6BCF7A' : msg.ticket.status === 'in_progress' ? '#3A8DDE' : '#f59e0b' }}
              >{msg.ticket.status.replace('_', ' ')}</span>
            </div>
          </Link>
        )}

        {/* Text */}
        {msg.message && (
          <div
            className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
            style={isOwn
              ? { background: '#3A8DDE', color: 'white', borderBottomRightRadius: '4px', boxShadow: '0 2px 8px rgba(58,141,222,0.25)' }
              : isAI
              ? { background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#6d28d9', borderBottomLeftRadius: '4px' }
              : { background: '#f1f5f9', color: '#334155', borderBottomLeftRadius: '4px' }}
          >
            {msg.message.split(/(@\w+)/g).map((part, i) => {
              if (!part.startsWith('@')) return part;
              const lower = part.toLowerCase();
              if (isOwn) {
                // On blue bubble — use white tinted pills for readability
                return <span key={i} style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '1px 5px' }}>{part}</span>;
              }
              const color = lower === '@ai' ? '#8b5cf6' : lower === '@client' ? '#f59e0b' : lower === '@dev' ? '#16a34a' : '#3A8DDE';
              return <span key={i} style={{ color, fontWeight: 700, background: `${color}18`, borderRadius: 4, padding: '1px 4px' }}>{part}</span>;
            })}
          </div>
        )}

        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="mt-1 space-y-1">
            {msg.attachments.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={isOwn
                  ? { background: '#1a85c840', color: '#1E2A32' }
                  : { background: '#f1f5f9', color: '#334155' }}
              >
                {a.type === 'voice' ? <Mic className="w-3.5 h-3.5" /> : a.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                <span className="truncate max-w-[160px]">{a.filename}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px]" style={{ color: '#8A97A3' }}>{formatTime(msg.createdAt)}</span>
          {isOwn && (isRead
            ? <CheckCheck className="w-3 h-3" style={{ color: '#3A8DDE' }} />
            : <Check className="w-3 h-3" style={{ color: '#8A97A3' }} />)}
        </div>
      </div>
    </div>
  );
}

export default function AdminChatsPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [showThreads, setShowThreads] = useState(true); // mobile: toggle between sidebar and chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date());

  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
    setHasMore(false);
    try {
      const res = await fetch(`/api/chats?projectId=${projectId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const result = await res.json();
      if (result.success) {
        setMessages(result.data);
        setHasMore(result.hasMore ?? false);
        setLastPollTime(new Date());
        markRead(projectId);
      }
    } catch { /* ignore */ } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadMoreMessages = useCallback(async () => {
    if (!selectedThread || isLoadingMore || !hasMore) return;
    const oldest = messages[0];
    if (!oldest?.createdAt) return;

    setIsLoadingMore(true);
    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    try {
      const before = new Date(oldest.createdAt).toISOString();
      const res = await fetch(`/api/chats?projectId=${selectedThread.projectId}&before=${encodeURIComponent(before)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const result = await res.json();
      if (result.success && result.data.length > 0) {
        setMessages(prev => [...result.data, ...prev]);
        setHasMore(result.hasMore ?? false);
        // Restore scroll position so the view doesn't jump
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      } else {
        setHasMore(false);
      }
    } catch { /* ignore */ } finally {
      setIsLoadingMore(false);
    }
  }, [selectedThread, isLoadingMore, hasMore, messages]);

  // Scroll to bottom on initial load and when new messages arrive, but NOT when loading older ones
  const prevOldestId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (messages.length === 0) return;
    const oldestId = messages[0]?._id;
    // If oldest message changed, we prepended older ones — don't scroll
    if (oldestId !== prevOldestId.current && prevOldestId.current !== undefined) {
      prevOldestId.current = oldestId;
      return;
    }
    prevOldestId.current = oldestId;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // IntersectionObserver on the top sentinel to trigger loading older messages
  useEffect(() => {
    const sentinel = messagesTopRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreMessages(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreMessages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [newMessage]);

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

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const match = before.match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
  };

  const completeMention = (handle: string) => {
    const cursor = textareaRef.current?.selectionStart ?? newMessage.length;
    const before = newMessage.slice(0, cursor);
    const after = newMessage.slice(cursor);
    const replaced = before.replace(/@(\w*)$/, handle + ' ');
    setNewMessage(replaced + after);
    setMentionQuery(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') { setMentionQuery(null); return; }
    if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="px-8 pt-8 pb-6 bg-white flex-shrink-0" style={{ borderBottom: '1px solid #DDE5EC' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#1E2A32', letterSpacing: '-0.02em', fontWeight: 800 }}>All Chat Threads</h1>
        <p className="text-sm mt-1" style={{ color: '#5F6B76' }}>{threads.length} project conversations · polling every 3s</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Thread sidebar */}
        <div
          className={`flex-shrink-0 overflow-y-auto w-full lg:w-72 ${showThreads ? 'flex' : 'hidden'} lg:flex flex-col`}
          style={{ borderRight: '1px solid #DDE5EC', background: 'rgba(58,141,222,0.06)' }}
        >
          {/* mobile header */}
          <div className="lg:hidden px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #DDE5EC' }}>
            <p className="text-xs font-semibold" style={{ color: '#8A97A3' }}>SELECT A CONVERSATION</p>
          </div>
          {isLoadingThreads ? (
            <div className="flex justify-center pt-10">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            </div>
          ) : threads.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
              <p className="text-sm" style={{ color: '#8A97A3' }}>No conversations yet</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {threads.map(thread => {
                const isSelected = selectedThread?.projectId === thread.projectId;
                return (
                  <button
                    key={thread.projectId}
                    onClick={() => { setSelectedThread(thread); setShowThreads(false); }}
                    className="w-full text-left p-3 rounded-xl transition-all"
                    style={isSelected
                      ? { background: '#eff8ff', border: '1px solid #c8dff0' }
                      : { border: '1px solid transparent' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                          {thread.clientAvatar
                            ? <img src={thread.clientAvatar} alt={thread.clientName} className="w-9 h-9 rounded-full object-cover" />
                            : <span className="text-xs font-bold text-white">{initials(thread.clientName)}</span>}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: '#6BCF7A', border: '2px solid rgba(58,141,222,0.06)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-medium truncate" style={{ color: '#1E2A32' }}>{thread.clientName}</p>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                            {thread.lastMessage && (
                              <span className="text-[10px]" style={{ color: '#8A97A3' }}>{formatTime(thread.lastMessage.createdAt)}</span>
                            )}
                            {(thread.unreadCount ?? 0) > 0 && (
                              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold rounded-full" style={{ background: '#f59e0b' }}>
                                {(thread.unreadCount ?? 0) > 9 ? '9+' : thread.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs truncate flex items-center gap-1" style={{ color: '#8A97A3' }}>
                          <FolderKanban className="w-3 h-3 flex-shrink-0" />
                          {thread.projectName}
                        </p>
                        {thread.lastMessage && (
                          <p className="text-[11px] truncate mt-0.5" style={{ color: '#8A97A3' }}>
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
          <div className={`flex-1 flex-col overflow-hidden ${showThreads ? 'hidden lg:flex' : 'flex'}`} style={{ background: '#ffffff' }}>
            {/* Chat header */}
            <div className="px-4 lg:px-6 py-3.5 flex items-center gap-3" style={{ borderBottom: '1px solid #DDE5EC', background: '#fafcff' }}>
              {/* Back button — mobile only */}
              <button
                className="lg:hidden flex-shrink-0 p-1.5 rounded-lg mr-1"
                style={{ color: '#5F6B76', background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}
                onClick={() => setShowThreads(true)}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                {selectedThread.clientAvatar
                  ? <img src={selectedThread.clientAvatar} alt={selectedThread.clientName} className="w-9 h-9 rounded-full object-cover" />
                  : <span className="text-xs font-bold text-white">{initials(selectedThread.clientName)}</span>}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{selectedThread.clientName}</p>
                <p className="text-xs flex items-center gap-1.5" style={{ color: '#8A97A3' }}>
                  <FolderKanban className="w-3 h-3" />
                  {selectedThread.projectName}
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] capitalize" style={{ background: '#f1f5f9', color: '#5F6B76' }}>{selectedThread.projectStatus}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#6BCF7A' }} />
                <span className="text-[10px] font-medium" style={{ color: '#6BCF7A' }}>Live</span>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4" style={{ background: 'rgba(58,141,222,0.06)' }}>
              {isLoadingMessages ? (
                <div className="flex justify-center pt-10">
                  <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center pt-10">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                  <p className="text-sm" style={{ color: '#8A97A3' }}>No messages yet. Start the conversation.</p>
                </div>
              ) : (
                <>
                  {/* Infinite scroll sentinel — sits above oldest message */}
                  <div ref={messagesTopRef} className="h-1" />

                  {/* Loading older messages indicator */}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
                      <span className="text-xs" style={{ color: '#8A97A3' }}>Loading older messages…</span>
                    </div>
                  )}

                  {/* No more messages indicator */}
                  {!hasMore && messages.length > 0 && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px" style={{ background: '#DDE5EC' }} />
                      <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#8A97A3' }}>Start of conversation</span>
                      <div className="flex-1 h-px" style={{ background: '#DDE5EC' }} />
                    </div>
                  )}

                  {messages.map(msg => (
                    <MessageRow key={msg._id} msg={msg} adminId={user?._id ?? ''} />
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Pending attachments */}
            {pendingAttachments.length > 0 && (
              <div className="px-4 pt-2 flex gap-2 flex-wrap" style={{ borderTop: '1px solid #f1f5f9' }}>
                {pendingAttachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs" style={{ background: '#f1f5f9', border: '1px solid #DDE5EC', color: '#334155' }}>
                    <FileText className="w-3 h-3" />
                    <span className="max-w-[120px] truncate">{a.filename}</span>
                    <button onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3" style={{ color: '#8A97A3' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4" style={{ borderTop: '1px solid #DDE5EC', background: '#ffffff' }}>
              {newMessage.toLowerCase().includes('@ai') && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                  <p className="text-xs" style={{ color: '#8b5cf6' }}>AI will respond to this message</p>
                </div>
              )}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 rounded-xl transition-colors pb-3 disabled:opacity-40"
                  style={{ color: '#8A97A3' }}
                >
                  {isUploading
                    ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
                    : <Paperclip className="w-4 h-4" />}
                </button>
                <div className="flex-1 relative">
                  {mentionQuery !== null && <MentionPicker query={mentionQuery} onSelect={completeMention} />}
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={handleMessageChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Reply to ${selectedThread.clientName}… @client, @dev, @AI`}
                    rows={1}
                    disabled={isSending}
                    className="w-full px-4 py-3 rounded-2xl resize-none focus:outline-none text-sm leading-relaxed transition-all"
                    style={{
                      background: 'rgba(58,141,222,0.06)',
                      border: '1px solid #DDE5EC',
                      color: '#334155',
                      minHeight: '44px',
                    }}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={isSending || (!newMessage.trim() && pendingAttachments.length === 0)}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center p-0 pb-1 flex-shrink-0 transition-all duration-150 active:scale-95 disabled:opacity-40"
                  style={{ background: '#3A8DDE', color: 'white' }}
                >
                  {isSending
                    ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                    : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex-1 items-center justify-center ${showThreads ? 'hidden lg:flex' : 'flex'}`} style={{ background: 'rgba(58,141,222,0.06)' }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#f1f5f9', border: '1px solid #DDE5EC' }}>
                <MessageSquare className="w-8 h-8" style={{ color: '#8A97A3' }} />
              </div>
              <p className="font-medium" style={{ color: '#334155' }}>Select a conversation</p>
              <p className="text-sm mt-1" style={{ color: '#8A97A3' }}>Choose a thread from the left to start chatting</p>
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
