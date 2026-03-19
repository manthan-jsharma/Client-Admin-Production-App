'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatMessage, ChatAttachment, Project } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  Send, ShieldCheck, Sparkles, Paperclip, Mic, Video,
  X, FileText, CheckCheck, Check, Bug, Zap, AlertCircle,
  ChevronDown, FolderKanban, Clock, Package, ExternalLink,
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
  const bubbleStyle: React.CSSProperties = isOwn
    ? { background: '#eff8ff', border: '1px solid #c8dff0', color: '#3A8DDE' }
    : { background: '#ffffff', border: '1px solid #DDE5EC', color: '#334155' };

  if (a.type === 'voice') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={bubbleStyle}>
        <Mic className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{a.filename}</span>
        <span className="opacity-60">{formatSize(a.size)}</span>
        {a.s3Key && !a.s3Key.startsWith('mock://') && (
          <a href={a.s3Key} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" title="Download">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }
  if (a.type === 'video') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={bubbleStyle}>
        <Video className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{a.filename}</span>
        <span className="opacity-60">{formatSize(a.size)}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={bubbleStyle}>
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
    ? '#6BCF7A' : ticket.status === 'in_progress'
    ? '#3A8DDE' : '#f59e0b';

  return (
    <div
      className="rounded-xl p-3 text-xs w-64"
      style={isOwn
        ? { background: '#eff8ff', border: '1px solid #c8dff0' }
        : { background: '#ffffff', border: '1px solid #DDE5EC' }
      }
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f1f5f9' }}>
          <TypeIcon className="w-3.5 h-3.5" style={{ color: '#334155' }} />
        </div>
        <span className="font-semibold truncate" style={{ color: '#1E2A32' }}>{ticket.title}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="capitalize" style={{ color: '#5F6B76' }}>{ticket.type.replace('_', ' ')}</span>
        <span className="font-medium capitalize" style={{ color: statusColor }}>{ticket.status.replace('_', ' ')}</span>
      </div>
      <p className="mt-1 text-[10px]" style={{ color: '#8A97A3' }}>Ticket #{ticket.ticketId.slice(-8)}</p>
    </div>
  );
}

// ─── @mention renderer ───────────────────────────────────────────────────────

function renderWithMentions(text: string) {
  return text.split(/(@\w+)/g).map((part, i) => {
    if (!part.startsWith('@')) return part;
    const lower = part.toLowerCase();
    const color = lower === '@ai' ? '#8b5cf6'
      : lower === '@admin' ? '#3A8DDE'
      : lower === '@dev' ? '#16a34a'
      : '#f59e0b';
    return (
      <span key={i} style={{ color, fontWeight: 700, background: `${color}18`, borderRadius: 4, padding: '1px 4px' }}>
        {part}
      </span>
    );
  });
}

// ─── Mention picker ───────────────────────────────────────────────────────────

const MENTION_OPTIONS = [
  { handle: '@AI',    label: 'AI Assistant', color: '#8b5cf6' },
  { handle: '@admin', label: 'Admin',        color: '#3A8DDE' },
  { handle: '@dev',   label: 'Developer',   color: '#16a34a' },
];

function MentionPicker({ query, onSelect }: { query: string; onSelect: (handle: string) => void }) {
  const filtered = MENTION_OPTIONS.filter(o => o.handle.toLowerCase().startsWith('@' + query.toLowerCase()));
  if (filtered.length === 0) return null;
  return (
    <div
      className="absolute bottom-full mb-1 left-0 z-50 rounded-xl overflow-hidden"
      style={{ background: '#ffffff', border: '1px solid #DDE5EC', boxShadow: '0 8px 24px rgba(30,40,60,0.12)', minWidth: 180 }}
    >
      {filtered.map(opt => (
        <button
          key={opt.handle}
          onMouseDown={e => { e.preventDefault(); onSelect(opt.handle); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
          style={{ fontSize: 13 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <span style={{ fontWeight: 700, color: opt.color }}>{opt.handle}</span>
          <span style={{ color: '#5F6B76', fontSize: 11 }}>{opt.label}</span>
        </button>
      ))}
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
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={isAI
            ? { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }
            : { background: 'linear-gradient(135deg, #3A8DDE, #2F6FB2)' }
          }
        >
          {isAI ? <Sparkles className="w-3.5 h-3.5 text-white" /> : <ShieldCheck className="w-3.5 h-3.5 text-white" />}
        </div>
      )}

      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender label */}
        <span className="text-[10px] mb-1 px-1" style={{ color: '#8A97A3' }}>
          {isAI ? 'AI Assistant' : msg.senderName}
        </span>

        {/* Ticket card */}
        {msg.type === 'ticket' && msg.ticket && (
          <TicketBubble ticket={msg.ticket} isOwn={isOwn} />
        )}

        {/* Text bubble */}
        {msg.message && (
          <div
            className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
            style={isOwn
              ? { background: '#3A8DDE', color: 'white', borderBottomRightRadius: '4px', boxShadow: '0 2px 8px rgba(58,141,222,0.2)' }
              : isAI
              ? { background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#6d28d9', borderBottomLeftRadius: '4px' }
              : { background: '#ffffff', border: '1px solid #DDE5EC', color: '#334155', borderBottomLeftRadius: '4px' }
            }
          >
            {renderWithMentions(msg.message)}
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
          <span className="text-[10px]" style={{ color: '#8A97A3' }}>{formatTime(msg.createdAt)}</span>
          {isOwn && (
            isRead
              ? <CheckCheck className="w-3 h-3" style={{ color: '#3A8DDE' }} />
              : <Check className="w-3 h-3" style={{ color: '#8A97A3' }} />
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #DDE5EC' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Submit a Support Ticket</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#5F6B76' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(58,141,222,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = '#1E2A32'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#5F6B76'; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: '#5F6B76' }}>Ticket type</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'bug', label: 'Bug / Error', icon: Bug, desc: 'Something is broken' },
                { value: 'feature_request', label: 'Feature Request', icon: Zap, desc: 'I need something new' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTicketType(opt.value)}
                  className="p-3 rounded-xl border text-left transition-all"
                  style={ticketType === opt.value
                    ? { border: '1px solid #c8dff0', background: '#eff8ff' }
                    : { border: '1px solid #DDE5EC', background: 'rgba(58,141,222,0.06)' }
                  }
                >
                  <opt.icon className="w-4 h-4 mb-1.5" style={{ color: ticketType === opt.value ? '#3A8DDE' : '#8A97A3' }} />
                  <p className="text-xs font-semibold" style={{ color: ticketType === opt.value ? '#1E2A32' : '#5F6B76' }}>{opt.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#8A97A3' }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: '#5F6B76' }}>Title <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Brief summary of the issue..."
              maxLength={120}
              className="w-full px-3.5 py-2.5 rounded-xl focus:outline-none text-sm"
              style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3A8DDE'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,141,222,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#DDE5EC'; e.currentTarget.style.boxShadow = 'none'; }}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: '#5F6B76' }}>Description <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue or feature in detail..."
              rows={4}
              maxLength={1000}
              className="w-full px-3.5 py-2.5 rounded-xl focus:outline-none text-sm resize-none"
              style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3A8DDE'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,141,222,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#DDE5EC'; e.currentTarget.style.boxShadow = 'none'; }}
              required
            />
            <p className="text-[10px] text-right" style={{ color: '#8A97A3' }}>{description.length}/1000</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isSending || !title.trim() || !description.trim()}
              className="flex-1 flex items-center justify-center gap-2 font-medium rounded-xl h-10 text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
              style={{ background: '#3A8DDE', color: 'white' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2F6FB2'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3A8DDE'; }}
            >
              {isSending
                ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                : <Send className="w-4 h-4" />}
              Submit Ticket
            </button>
            <button
              type="button"
              onClick={onClose}
              className="font-medium rounded-xl h-10 px-5 text-sm transition-all duration-150 active:scale-95"
              style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}
            >
              Cancel
            </button>
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
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

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
        } else {
          // No project yet — use personal inbox so client can still reach admin/AI
          setActiveProjectId(`inbox_${user?._id}`);
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

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    // Detect @mention trigger: find last @ and extract word after it
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
      <div className="px-4 sm:px-8 pt-5 sm:pt-8 pb-4 sm:pb-5 bg-white flex-shrink-0" style={{ borderBottom: '1px solid #DDE5EC' }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#1E2A32', letterSpacing: '-0.02em', fontWeight: 800 }}>Chat</h1>
            <p className="text-xs sm:text-sm mt-1" style={{ color: '#5F6B76' }}>
              Type <span style={{ color: '#8b5cf6', fontWeight: 500 }}>@AI</span> to ask the AI assistant anything
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(107,207,122,0.1)', border: '1px solid #a7f3d0' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#6BCF7A' }} />
              <span className="text-xs font-medium" style={{ color: '#6BCF7A' }}>Live</span>
            </div>
          </div>
        </div>

        {/* Project tabs */}
        {projects.length > 1 && (
          <div
            className="mt-4 flex items-center gap-1 p-1 rounded-xl w-fit"
            style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}
          >
            {projects.map(p => (
              <button
                key={p._id}
                onClick={() => setActiveProjectId(p._id ?? null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                style={activeProjectId === p._id
                  ? { background: '#ffffff', color: '#1E2A32', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#5F6B76' }
                }
              >
                <FolderKanban className="w-3 h-3" />
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat body */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-2 sm:p-6">
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ background: '#ffffff', border: '1px solid #DDE5EC', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)', borderRadius: '16px' }}
        >

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4" style={{ background: 'rgba(58,141,222,0.06)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
                  <ShieldCheck className="w-8 h-8" style={{ color: '#3A8DDE' }} />
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#1E2A32' }}>Start the conversation</p>
                  <p className="text-sm" style={{ color: '#5F6B76' }}>
                    Message your admin or type <span style={{ color: '#8b5cf6' }}>@AI</span> for instant answers
                  </p>
                </div>
                <div className="mt-2 flex flex-col gap-2 w-full max-w-xs text-left">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8A97A3' }}>Try saying:</p>
                  {[
                    '@AI What services do you offer?',
                    '@AI How do I upload my brand files?',
                    'I have a question about my project timeline',
                  ].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setNewMessage(s)}
                      className="px-3 py-2 rounded-xl text-xs text-left transition-all"
                      style={{ background: '#ffffff', border: '1px solid #DDE5EC', color: '#334155' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c8dff0'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(58,141,222,0.06)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#DDE5EC'; (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'; }}
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
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] mb-1 px-1" style={{ color: '#8A97A3' }}>AI Assistant</span>
                      <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                        <div className="flex gap-0.5">
                          {[0, 150, 300].map(d => (
                            <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: `${d}ms`, background: '#8b5cf6' }} />
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
            <div className="px-4 pt-3 flex items-center gap-3" style={{ borderTop: '1px solid #DDE5EC' }}>
              <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
                <Package className="w-4 h-4 flex-shrink-0" style={{ color: '#3A8DDE' }} />
                <p className="text-xs" style={{ color: '#334155' }}>
                  Service inquiry: <span className="font-semibold" style={{ color: '#1E2A32' }}>{inquiryBanner}</span>
                  <span className="ml-1" style={{ color: '#5F6B76' }}>— edit the message below before sending</span>
                </p>
              </div>
              <button
                onClick={() => setInquiryBanner(null)}
                className="p-1.5 rounded-lg flex-shrink-0 transition-colors"
                style={{ color: '#8A97A3' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLButtonElement).style.color = '#334155'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#8A97A3'; }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Pending attachments preview */}
          {pendingAttachments.length > 0 && (
            <div className="px-4 pt-3 flex gap-2 flex-wrap" style={{ borderTop: '1px solid #DDE5EC' }}>
              {pendingAttachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs"
                  style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155' }}
                >
                  {a.type === 'voice' ? <Mic className="w-3 h-3" style={{ color: '#6BCF7A' }} /> :
                   a.type === 'video' ? <Video className="w-3 h-3" style={{ color: '#3A8DDE' }} /> :
                   <FileText className="w-3 h-3" style={{ color: '#5F6B76' }} />}
                  <span className="max-w-[120px] truncate">{a.filename}</span>
                  <button
                    onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))}
                    className="transition-colors"
                    style={{ color: '#8A97A3' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8A97A3'; }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="p-2 sm:p-4" style={{ borderTop: '1px solid #DDE5EC', background: '#ffffff' }}>
            {/* AI hint */}
            {newMessage.toLowerCase().includes('@ai') && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8b5cf6' }} />
                <p className="text-xs" style={{ color: '#8b5cf6' }}>AI will respond to your message</p>
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* Toolbar */}
              <div className="flex flex-col gap-1.5 pb-0.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  title="Attach file"
                  className="p-2 rounded-xl transition-colors disabled:opacity-40"
                  style={{ color: '#8A97A3' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLButtonElement).style.color = '#334155'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#8A97A3'; }}
                >
                  {isUploading
                    ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
                    : <Paperclip className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowTicketForm(true)}
                  title="Submit support ticket"
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: '#8A97A3' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fffbeb'; (e.currentTarget as HTMLButtonElement).style.color = '#f59e0b'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#8A97A3'; }}
                >
                  <AlertCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Message textarea */}
              <div className="flex-1 relative">
                {mentionQuery !== null && (
                  <MentionPicker query={mentionQuery} onSelect={completeMention} />
                )}
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={handleMessageChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… @AI, @admin, @dev"
                  rows={1}
                  disabled={isSending}
                  className="w-full px-4 py-3 rounded-2xl resize-none focus:outline-none text-sm leading-relaxed transition-all"
                  style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32', minHeight: '44px' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#3A8DDE'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,141,222,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#DDE5EC'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={isSending || (!newMessage.trim() && pendingAttachments.length === 0)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center p-0 transition-all duration-150 active:scale-95 flex-shrink-0 disabled:opacity-40"
                style={{ background: '#3A8DDE', color: 'white' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2F6FB2'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3A8DDE'; }}
              >
                {isSending
                  ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1 mt-2 px-1 flex-wrap text-[10px]" style={{ color: '#8A97A3' }}>
              <span>Press <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: '#f1f5f9', color: '#5F6B76' }}>Enter</kbd> to send</span>
              <span>·</span>
              <span><kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: '#f1f5f9', color: '#5F6B76' }}>Shift+Enter</kbd> for new line</span>
              <span>·</span>
              <button onClick={() => setShowTicketForm(true)} className="transition-colors" style={{ color: '#f59e0b' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#d97706'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f59e0b'; }}>
                Report issue
              </button>
            </div>
            <div className="sm:hidden flex justify-end mt-1.5 px-1">
              <button onClick={() => setShowTicketForm(true)} className="text-[10px] transition-colors" style={{ color: '#f59e0b' }}>
                Report issue
              </button>
            </div>
          </div>
        </div>
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
