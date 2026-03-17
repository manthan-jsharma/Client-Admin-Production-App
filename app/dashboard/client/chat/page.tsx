'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatMessage, ChatAttachment, Project } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  Send, ShieldCheck, Sparkles, Paperclip, Mic, Video,
  X, FileText, CheckCheck, Check, Bug, Zap, AlertCircle,
  ChevronDown, FolderKanban, Clock, Package,
} from 'lucide-react';

const POLL_INTERVAL_MS = 3000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Attachment preview ───────────────────────────────────────────────────────

function AttachmentBubble({ a, isOwn }: { a: ChatAttachment; isOwn: boolean }) {
  const base = isOwn ? 'bg-blue-700/60 text-blue-100' : 'bg-slate-600/60 text-slate-200';
  if (a.type === 'voice') {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${base}`}>
        <Mic className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{a.filename}</span>
        <span className="opacity-60">{formatSize(a.size)}</span>
        {/* TODO: Replace with real S3 URL when connected */}
        <span className="opacity-40 text-[10px] font-mono truncate max-w-[100px]">{a.s3Key}</span>
      </div>
    );
  }
  if (a.type === 'video') {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${base}`}>
        <Video className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{a.filename}</span>
        <span className="opacity-60">{formatSize(a.size)}</span>
      </div>
    );
  }
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${base}`}>
      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate max-w-[180px]">{a.filename}</span>
      <span className="opacity-60 flex-shrink-0">{formatSize(a.size)}</span>
    </div>
  );
}

// ─── Ticket bubble ────────────────────────────────────────────────────────────

function TicketBubble({ ticket, isOwn }: { ticket: NonNullable<ChatMessage['ticket']>; isOwn: boolean }) {
  const typeIcon = ticket.type === 'bug' ? Bug : Zap;
  const TypeIcon = typeIcon;
  const statusColor = ticket.status === 'resolved'
    ? 'text-emerald-400' : ticket.status === 'in_progress'
    ? 'text-blue-400' : 'text-amber-400';

  return (
    <div className={`rounded-xl border p-3 text-xs w-64 ${
      isOwn ? 'bg-blue-700/30 border-blue-500/30' : 'bg-slate-700/40 border-slate-600/40'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <TypeIcon className="w-3.5 h-3.5 text-slate-300" />
        </div>
        <span className="font-semibold text-white truncate">{ticket.title}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-500 capitalize">{ticket.type.replace('_', ' ')}</span>
        <span className={`font-medium capitalize ${statusColor}`}>{ticket.status.replace('_', ' ')}</span>
      </div>
      <p className="text-slate-600 mt-1 text-[10px]">Ticket #{ticket.ticketId.slice(-8)}</p>
    </div>
  );
}

// ─── Message row ──────────────────────────────────────────────────────────────

function MessageRow({ msg, userId }: { msg: ChatMessage; userId: string }) {
  const isOwn = msg.senderId === userId;
  const isAI = msg.senderRole === 'ai';
  const isAdmin = msg.senderRole === 'admin';
  const isRead = (msg.readBy ?? []).length > 1;

  return (
    <div className={`flex items-end gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isOwn && (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isAI ? 'bg-gradient-to-br from-violet-600 to-purple-700' : 'bg-gradient-to-br from-blue-600 to-blue-800'
        }`}>
          {isAI ? <Sparkles className="w-3.5 h-3.5 text-white" /> : <ShieldCheck className="w-3.5 h-3.5 text-white" />}
        </div>
      )}

      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender label */}
        <span className="text-[10px] text-slate-600 mb-1 px-1">
          {isAI ? 'AI Assistant' : msg.senderName}
        </span>

        {/* Ticket card */}
        {msg.type === 'ticket' && msg.ticket && (
          <TicketBubble ticket={msg.ticket} isOwn={isOwn} />
        )}

        {/* Text bubble */}
        {msg.message && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm shadow-lg shadow-blue-600/20'
              : isAI
              ? 'bg-gradient-to-br from-violet-600/20 to-purple-700/20 border border-violet-500/20 text-violet-100 rounded-bl-sm'
              : 'bg-slate-700/80 text-slate-100 rounded-bl-sm'
          }`}>
            {/* Highlight @AI tags */}
            {msg.message.split(/(@AI\b)/gi).map((part, i) =>
              /^@AI$/i.test(part)
                ? <span key={i} className="text-violet-300 font-semibold">{part}</span>
                : part
            )}
          </div>
        )}

        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className={`mt-1.5 space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
            {msg.attachments.map((a, i) => (
              <AttachmentBubble key={i} a={a} isOwn={isOwn} />
            ))}
          </div>
        )}

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-slate-600">{formatTime(msg.createdAt)}</span>
          {isOwn && (
            isRead
              ? <CheckCheck className="w-3 h-3 text-blue-400" />
              : <Check className="w-3 h-3 text-slate-600" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Ticket Form Modal ────────────────────────────────────────────────────────

interface TicketFormProps {
  onSubmit: (type: 'bug' | 'feature_request', title: string, description: string) => void;
  onClose: () => void;
  isSending: boolean;
}

function TicketForm({ onSubmit, onClose, isSending }: TicketFormProps) {
  const [ticketType, setTicketType] = useState<'bug' | 'feature_request'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit(ticketType, title.trim(), description.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Submit a Support Ticket</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Ticket type</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'bug', label: 'Bug / Error', icon: Bug, desc: 'Something is broken' },
                { value: 'feature_request', label: 'Feature Request', icon: Zap, desc: 'I need something new' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTicketType(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    ticketType === opt.value
                      ? 'border-blue-500/50 bg-blue-600/10'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                  }`}
                >
                  <opt.icon className={`w-4 h-4 mb-1.5 ${ticketType === opt.value ? 'text-blue-400' : 'text-slate-500'}`} />
                  <p className={`text-xs font-semibold ${ticketType === opt.value ? 'text-white' : 'text-slate-400'}`}>{opt.label}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Title <span className="text-red-400">*</span></label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Brief summary of the issue..."
              maxLength={120}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Description <span className="text-red-400">*</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue or feature in detail..."
              rows={4}
              maxLength={1000}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm resize-none"
              required
            />
            <p className="text-[10px] text-slate-600 text-right">{description.length}/1000</p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={isSending || !title.trim() || !description.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl h-10 text-sm disabled:opacity-50"
            >
              {isSending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send className="w-4 h-4" />}
              Submit Ticket
            </Button>
            <Button type="button" onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl h-10 px-5 text-sm">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [inquiryBanner, setInquiryBanner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── pre-fill from ?inquiry= URL param (service inquiry flow) ───────────────
  useEffect(() => {
    const inquiry = searchParams.get('inquiry');
    if (inquiry) {
      setNewMessage(decodeURIComponent(inquiry));
      setInquiryBanner(searchParams.get('service') || null);
    }
  }, [searchParams]);

  // ── fetch projects ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        });
        const result = await res.json();
        if (result.success && result.data.length > 0) {
          setProjects(result.data);
          setActiveProjectId(result.data[0]._id ?? null);
        }
      } catch { /* ignore */ }
    };
    fetchProjects();
  }, []);

  // ── initial messages load ───────────────────────────────────────────────────
  useEffect(() => {
    if (!activeProjectId) return;
    setIsLoading(true);
    setMessages([]);
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chats?projectId=${activeProjectId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        });
        const result = await res.json();
        if (result.success) {
          setMessages(result.data);
          setLastPollTime(new Date());
          // Mark as read
          markRead(activeProjectId);
        }
      } catch { /* ignore */ } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [activeProjectId]);

  // ── polling ─────────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const since = lastPollTime.toISOString();
      const res = await fetch(`/api/chats?projectId=${activeProjectId}&since=${since}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const result = await res.json();
      if (result.success && result.data.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m._id));
          const fresh = result.data.filter((m: ChatMessage) => !existingIds.has(m._id));
          if (fresh.length === 0) return prev;
          markRead(activeProjectId);
          return [...prev, ...fresh];
        });
        setLastPollTime(new Date());
      }
    } catch { /* ignore */ }
  }, [activeProjectId, lastPollTime]);

  useEffect(() => {
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [poll]);

  // ── scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── auto-resize textarea ────────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [newMessage]);

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
    } catch { /* ignore */ }
  };

  // ── send message ────────────────────────────────────────────────────────────
  const sendMessage = async (opts?: {
    ticketType?: 'bug' | 'feature_request';
    ticketTitle?: string;
    ticketDescription?: string;
  }) => {
    if (!activeProjectId) return;
    const text = newMessage.trim();
    const isTicket = !!opts?.ticketType;
    if (!text && !isTicket && pendingAttachments.length === 0) return;

    setIsSending(true);
    try {
      const body: Record<string, unknown> = {
        projectId: activeProjectId,
        message: isTicket ? `Submitted a support ticket: ${opts!.ticketTitle}` : text,
        type: isTicket ? 'ticket' : pendingAttachments.length > 0 ? pendingAttachments[0].type : 'text',
      };
      if (pendingAttachments.length > 0) body.attachments = pendingAttachments;
      if (isTicket) {
        body.ticket = {
          ticketType: opts!.ticketType,
          title: opts!.ticketTitle,
          description: opts!.ticketDescription,
        };
      }

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
          const existingIds = new Set(prev.map(m => m._id));
          return [...prev, ...newMsgs.filter(m => !existingIds.has(m._id))];
        });
        setNewMessage('');
        setPendingAttachments([]);
        setLastPollTime(new Date());
      }
    } catch { /* ignore */ } finally {
      setIsSending(false);
      setShowTicketForm(false);
    }
  };

  // ── file upload ─────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProjectId) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('projectId', activeProjectId);

      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: fd,
      });
      const result = await res.json();
      if (result.success) {
        setPendingAttachments(prev => [...prev, result.data]);
      }
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

  const activeProject = projects.find(p => p._id === activeProjectId);
  const isAITyping = isSending && newMessage.toLowerCase().includes('@ai');

  return (
    <div className="h-screen flex flex-col">
      {/* Ticket Form Modal */}
      {showTicketForm && (
        <TicketForm
          onSubmit={(type, title, desc) => sendMessage({ ticketType: type, ticketTitle: title, ticketDescription: desc })}
          onClose={() => setShowTicketForm(false)}
          isSending={isSending}
        />
      )}

      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Chat</h1>
            <p className="text-sm text-slate-500 mt-1">
              Type <span className="text-violet-400 font-medium">@AI</span> to ask the AI assistant anything
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Live</span>
            </div>
          </div>
        </div>

        {/* Project tabs */}
        {projects.length > 1 && (
          <div className="mt-4 flex items-center gap-1 p-1 bg-slate-800/60 border border-slate-700/50 rounded-xl w-fit">
            {projects.map(p => (
              <button
                key={p._id}
                onClick={() => setActiveProjectId(p._id ?? null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeProjectId === p._id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <FolderKanban className="w-3 h-3" />
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat body */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-6">
        <Card className="flex-1 bg-slate-800/60 border-slate-700/50 flex flex-col overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">Start the conversation</p>
                  <p className="text-slate-500 text-sm">Message your admin or type <span className="text-violet-400">@AI</span> for instant answers</p>
                </div>
                <div className="mt-2 flex flex-col gap-2 w-full max-w-xs text-left">
                  <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Try saying:</p>
                  {[
                    '@AI What services do you offer?',
                    '@AI How do I upload my brand files?',
                    'I have a question about my project timeline',
                  ].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setNewMessage(s)}
                      className="px-3 py-2 bg-slate-700/40 hover:bg-slate-700/60 border border-slate-700/50 rounded-xl text-xs text-slate-400 hover:text-white transition-all text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(msg => (
                  <MessageRow key={msg._id} msg={msg} userId={user?._id ?? ''} />
                ))}
                {/* AI typing indicator */}
                {isAITyping && (
                  <div className="flex items-end gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] text-slate-600 mb-1 px-1">AI Assistant</span>
                      <div className="bg-slate-700/60 border border-slate-600/40 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1">
                        <div className="flex gap-0.5">
                          {[0, 150, 300].map(d => (
                            <div key={d} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Service inquiry banner */}
          {inquiryBanner && (
            <div className="px-4 pt-3 flex items-center gap-3 border-t border-slate-700/30">
              <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <Package className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <p className="text-xs text-blue-300">
                  Service inquiry: <span className="font-semibold text-white">{inquiryBanner}</span>
                  <span className="text-blue-400/70 ml-1">— edit the message below before sending</span>
                </p>
              </div>
              <button
                onClick={() => setInquiryBanner(null)}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Pending attachments preview */}
          {pendingAttachments.length > 0 && (
            <div className="px-4 pt-3 flex gap-2 flex-wrap border-t border-slate-700/30">
              {pendingAttachments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-700/60 rounded-xl border border-slate-600/40 text-xs text-slate-300">
                  {a.type === 'voice' ? <Mic className="w-3 h-3 text-emerald-400" /> :
                   a.type === 'video' ? <Video className="w-3 h-3 text-blue-400" /> :
                   <FileText className="w-3 h-3 text-slate-400" />}
                  <span className="max-w-[120px] truncate">{a.filename}</span>
                  <button onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-500 hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-slate-700/50 p-4">
            {/* AI hint */}
            {newMessage.toLowerCase().includes('@ai') && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <p className="text-xs text-violet-400">AI will respond to your message</p>
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* Toolbar */}
              <div className="flex flex-col gap-1.5 pb-0.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  title="Attach file"
                  className="p-2 hover:bg-slate-700 rounded-xl text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
                >
                  {isUploading
                    ? <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                    : <Paperclip className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowTicketForm(true)}
                  title="Submit support ticket"
                  className="p-2 hover:bg-amber-500/10 rounded-xl text-slate-500 hover:text-amber-400 transition-colors"
                >
                  <AlertCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Message textarea */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… or @AI to ask the assistant"
                  rows={1}
                  disabled={isSending}
                  className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm leading-relaxed transition-all"
                  style={{ minHeight: '44px' }}
                />
              </div>

              {/* Send button */}
              <Button
                onClick={() => sendMessage()}
                disabled={isSending || (!newMessage.trim() && pendingAttachments.length === 0)}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center p-0 disabled:opacity-40 shadow-lg shadow-blue-600/20 transition-all flex-shrink-0"
              >
                {isSending
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />}
              </Button>
            </div>

            <p className="text-[10px] text-slate-600 mt-2 px-1">
              Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-500">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-500">Shift+Enter</kbd> for new line ·
              <button onClick={() => setShowTicketForm(true)} className="ml-1 text-amber-500/70 hover:text-amber-400 transition-colors">
                Report issue
              </button>
            </p>
          </div>
        </Card>
      </div>

      {/* Hidden file input */}
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
