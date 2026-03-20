"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage, ChatAttachment, Project } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import {
  Send,
  ShieldCheck,
  Sparkles,
  Paperclip,
  Mic,
  Video,
  X,
  FileText,
  CheckCheck,
  Check,
  FolderKanban,
  ExternalLink,
} from "lucide-react";

const POLL_INTERVAL_MS = 3000;

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentBubble({ a, isOwn }: { a: ChatAttachment; isOwn: boolean }) {
  const bubbleStyle: React.CSSProperties = isOwn
    ? {
        background: "rgba(107,207,122,0.1)",
        border: "1px solid rgba(107,207,122,0.25)",
        color: "#16a34a",
      }
    : { background: "#ffffff", border: "1px solid #DDE5EC", color: "#334155" };
  if (a.type === "voice")
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
        style={bubbleStyle}
      >
        <Mic className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{a.filename}</span>
        <span className="opacity-60">{formatSize(a.size)}</span>
        {a.s3Key && !a.s3Key.startsWith("mock://") && (
          <a href={a.s3Key} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        )}
      </div>
    );
  if (a.type === "video")
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
        style={bubbleStyle}
      >
        <Video className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{a.filename}</span>
        <span className="opacity-60">{formatSize(a.size)}</span>
      </div>
    );
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
      style={bubbleStyle}
    >
      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate max-w-[180px]">{a.filename}</span>
      <span className="opacity-60 flex-shrink-0">{formatSize(a.size)}</span>
    </div>
  );
}

function renderWithMentions(text: string, isOwn = false) {
  return text.split(/(@\w+)/g).map((part, i) => {
    if (!part.startsWith("@")) return part;
    const lower = part.toLowerCase();

    if (isOwn) {
      return (
        <span key={i} style={{ color: "rgba(255,255,255,0.95)", fontWeight: 700, background: "rgba(255,255,255,0.2)", borderRadius: 4, padding: "1px 5px" }}>
          {part}
        </span>
      );
    }

    const color =
      lower === "@ai"      ? "#8b5cf6"
      : lower === "@admin"   ? "#3A8DDE"
      : lower === "@dev"     ? "#16a34a"
      : lower === "@support" ? "#059669"
      : "#f59e0b";
    return (
      <span key={i} style={{ color, fontWeight: 700, background: `${color}18`, borderRadius: 4, padding: "1px 4px" }}>
        {part}
      </span>
    );
  });
}

const MENTION_OPTIONS = [
  { handle: "@AI", label: "AI Assistant", color: "#f59e0b" },
  { handle: "@admin", label: "Admin", color: "#3A8DDE" },
  { handle: "@client", label: "Client", color: "#f59e0b" },
  { handle: "@support", label: "Support Admin", color: "#059669" },
];

function MentionPicker({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (handle: string) => void;
}) {
  const filtered = MENTION_OPTIONS.filter((o) =>
    o.handle.toLowerCase().startsWith("@" + query.toLowerCase())
  );
  if (filtered.length === 0) return null;
  return (
    <div
      className="absolute bottom-full mb-1 left-0 z-50 rounded-xl overflow-hidden"
      style={{
        background: "#ffffff",
        border: "1px solid #DDE5EC",
        boxShadow: "0 8px 24px rgba(30,40,60,0.12)",
        minWidth: 180,
      }}
    >
      {filtered.map((opt) => (
        <button
          key={opt.handle}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(opt.handle);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
          style={{ fontSize: 13 }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(58,141,222,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <span style={{ fontWeight: 700, color: opt.color }}>
            {opt.handle}
          </span>
          <span style={{ color: "#5F6B76", fontSize: 11 }}>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function MessageRow({ msg, userId }: { msg: ChatMessage; userId: string }) {
  const isOwn = msg.senderId === userId;
  const isAI = msg.senderRole === "ai";
  const isRead = (msg.readBy ?? []).length > 1;

  return (
    <div
      className={`flex items-end gap-2.5 ${
        isOwn ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {!isOwn && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={
            isAI
              ? { background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }
              : { background: "linear-gradient(135deg,#3A8DDE,#2F6FB2)" }
          }
        >
          {isAI ? (
            <Sparkles className="w-3.5 h-3.5 text-white" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          )}
        </div>
      )}
      <div
        className={`max-w-[70%] flex flex-col ${
          isOwn ? "items-end" : "items-start"
        }`}
      >
        <span
          className="inline-flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
          style={
            isAI
              ? {
                  background: "#f5f3ff",
                  color: "#7c3aed",
                  border: "1px solid #ddd6fe",
                }
              : msg.senderRole === "admin"
              ? {
                  background: "#eff8ff",
                  color: "#3A8DDE",
                  border: "1px solid #c8dff0",
                }
              : msg.senderRole === "client"
              ? {
                  background: "rgba(58,141,222,0.06)",
                  color: "#5F6B76",
                  border: "1px solid #DDE5EC",
                }
              : {
                  background: "#f0fdf4",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                }
          }
        >
          {isAI
            ? "AI"
            : msg.senderRole === "admin"
            ? "Admin"
            : msg.senderRole === "client"
            ? "Client"
            : "Dev"}
        </span>
        {msg.message && (
          <div
            className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
            style={
              isOwn
                ? {
                    background: "#6BCF7A",
                    color: "white",
                    borderBottomRightRadius: "4px",
                    boxShadow: "0 2px 8px rgba(107,207,122,0.2)",
                  }
                : isAI
                ? {
                    background: "#f5f3ff",
                    border: "1px solid #ddd6fe",
                    color: "#6d28d9",
                    borderBottomLeftRadius: "4px",
                  }
                : {
                    background: "#ffffff",
                    border: "1px solid #DDE5EC",
                    color: "#334155",
                    borderBottomLeftRadius: "4px",
                  }
            }
          >
            {renderWithMentions(msg.message, isOwn)}
          </div>
        )}
        {msg.attachments && msg.attachments.length > 0 && (
          <div
            className={`mt-1.5 space-y-1 ${
              isOwn ? "items-end" : "items-start"
            } flex flex-col`}
          >
            {msg.attachments.map((a, i) => (
              <AttachmentBubble key={i} a={a} isOwn={isOwn} />
            ))}
          </div>
        )}
        <div
          className={`flex items-center gap-1 mt-1 px-1 ${
            isOwn ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="text-[10px]" style={{ color: "#8A97A3" }}>
            {formatTime(msg.createdAt)}
          </span>
          {isOwn &&
            (isRead ? (
              <CheckCheck className="w-3 h-3" style={{ color: "#6BCF7A" }} />
            ) : (
              <Check className="w-3 h-3" style={{ color: "#8A97A3" }} />
            ))}
        </div>
      </div>
    </div>
  );
}

export default function DevChatPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    ChatAttachment[]
  >([]);
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date());
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/projects", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setProjects(res.data);
          setActiveProjectId(res.data[0]._id ?? null);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeProjectId) return;
    setIsLoading(true);
    setMessages([]);
    fetch(`/api/chats?projectId=${activeProjectId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setMessages(res.data);
          setLastPollTime(new Date());
          markRead(activeProjectId);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [activeProjectId]);

  const poll = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const res = await fetch(
        `/api/chats?projectId=${activeProjectId}&since=${lastPollTime.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      const result = await res.json();
      if (result.success && result.data.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m: ChatMessage) => m._id));
          const fresh = result.data.filter((m: ChatMessage) => !ids.has(m._id));
          if (fresh.length === 0) return prev;
          markRead(activeProjectId);
          return [...prev, ...fresh];
        });
        setLastPollTime(new Date());
      }
    } catch {
      /* ignore */
    }
  }, [activeProjectId, lastPollTime]);

  useEffect(() => {
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [poll]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [newMessage]);

  const markRead = async (projectId: string) => {
    try {
      await fetch("/api/chats/read", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });
    } catch {
      /* ignore */
    }
  };

  const sendMessage = async () => {
    if (!activeProjectId) return;
    const text = newMessage.trim();
    if (!text && pendingAttachments.length === 0) return;
    setIsSending(true);
    try {
      const body: Record<string, unknown> = {
        projectId: activeProjectId,
        message: text,
        type:
          pendingAttachments.length > 0 ? pendingAttachments[0].type : "text",
      };
      if (pendingAttachments.length > 0) body.attachments = pendingAttachments;
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        const newMsgs: ChatMessage[] = Array.isArray(result.data)
          ? result.data
          : [result.data];
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m._id));
          return [...prev, ...newMsgs.filter((m) => !ids.has(m._id))];
        });
        setNewMessage("");
        setPendingAttachments([]);
        setLastPollTime(new Date());
      }
    } catch {
      /* ignore */
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProjectId) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("projectId", activeProjectId);
      const res = await fetch("/api/chat/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: fd,
      });
      const result = await res.json();
      if (result.success)
        setPendingAttachments((prev) => [...prev, result.data]);
    } catch {
      /* ignore */
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    const cursor = e.target.selectionStart ?? val.length;
    const match = val.slice(0, cursor).match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
  };

  const completeMention = (handle: string) => {
    const cursor = textareaRef.current?.selectionStart ?? newMessage.length;
    const replaced = newMessage
      .slice(0, cursor)
      .replace(/@(\w*)$/, handle + " ");
    setNewMessage(replaced + newMessage.slice(cursor));
    setMentionQuery(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setMentionQuery(null);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && mentionQuery === null) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isAITyping = isSending && newMessage.toLowerCase().includes("@ai");

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div
        className="px-8 pt-8 pb-5 bg-white flex-shrink-0"
        style={{ borderBottom: "1px solid #DDE5EC" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                color: "#1E2A32",
                letterSpacing: "-0.02em",
                fontWeight: 800,
              }}
            >
              Chat
            </h1>
            <p className="text-sm mt-1" style={{ color: "#5F6B76" }}>
              Communicate with the team · type{" "}
              <span style={{ color: "#8b5cf6", fontWeight: 500 }}>@AI</span> for
              AI assistance
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{
              background: "rgba(107,207,122,0.1)",
              border: "1px solid rgba(107,207,122,0.3)",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#6BCF7A" }}
            />
            <span className="text-xs font-medium" style={{ color: "#16a34a" }}>
              Live
            </span>
          </div>
        </div>

        {projects.length > 1 && (
          <div
            className="mt-4 flex items-center gap-1 p-1 rounded-xl w-fit"
            style={{
              background: "rgba(58,141,222,0.06)",
              border: "1px solid #DDE5EC",
            }}
          >
            {projects.map((p) => (
              <button
                key={p._id}
                onClick={() => setActiveProjectId(p._id ?? null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                style={
                  activeProjectId === p._id
                    ? {
                        background: "#ffffff",
                        color: "#1E2A32",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      }
                    : { color: "#5F6B76" }
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
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-6">
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            background: "#ffffff",
            border: "1px solid #DDE5EC",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            borderRadius: "16px",
          }}
        >
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-5 space-y-4"
            style={{ background: "rgba(107,207,122,0.04)" }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div
                  className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: "rgba(107,207,122,0.2)",
                    borderTopColor: "#6BCF7A",
                  }}
                />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(107,207,122,0.1)",
                    border: "1px solid rgba(107,207,122,0.2)",
                  }}
                >
                  <ShieldCheck
                    className="w-8 h-8"
                    style={{ color: "#6BCF7A" }}
                  />
                </div>
                <div>
                  <p
                    className="font-semibold mb-1"
                    style={{ color: "#1E2A32" }}
                  >
                    Start the conversation
                  </p>
                  <p className="text-sm" style={{ color: "#5F6B76" }}>
                    Message the team or type{" "}
                    <span style={{ color: "#8b5cf6" }}>@AI</span> for help
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageRow
                    key={msg._id}
                    msg={msg}
                    userId={user?._id ?? ""}
                  />
                ))}
                {isAITyping && (
                  <div className="flex items-end gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span
                        className="text-[10px] mb-1 px-1"
                        style={{ color: "#8A97A3" }}
                      >
                        AI Assistant
                      </span>
                      <div
                        className="px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1"
                        style={{
                          background: "#f5f3ff",
                          border: "1px solid #ddd6fe",
                        }}
                      >
                        <div className="flex gap-0.5">
                          {[0, 150, 300].map((d) => (
                            <div
                              key={d}
                              className="w-1.5 h-1.5 rounded-full animate-bounce"
                              style={{
                                animationDelay: `${d}ms`,
                                background: "#8b5cf6",
                              }}
                            />
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

          {/* Pending attachments */}
          {pendingAttachments.length > 0 && (
            <div
              className="px-4 pt-3 flex gap-2 flex-wrap"
              style={{ borderTop: "1px solid #DDE5EC" }}
            >
              {pendingAttachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs"
                  style={{
                    background: "rgba(107,207,122,0.08)",
                    border: "1px solid rgba(107,207,122,0.2)",
                    color: "#334155",
                  }}
                >
                  {a.type === "voice" ? (
                    <Mic className="w-3 h-3" />
                  ) : a.type === "video" ? (
                    <Video className="w-3 h-3" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
                  <span className="max-w-[120px] truncate">{a.filename}</span>
                  <button
                    onClick={() =>
                      setPendingAttachments((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                    style={{ color: "#8A97A3" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#8A97A3";
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div
            className="p-4"
            style={{ borderTop: "1px solid #DDE5EC", background: "#ffffff" }}
          >
            {newMessage.toLowerCase().includes("@ai") && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <Sparkles
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "#8b5cf6" }}
                />
                <p className="text-xs" style={{ color: "#8b5cf6" }}>
                  AI will respond to your message
                </p>
              </div>
            )}
            <div className="flex items-end gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Attach file"
                className="p-2 rounded-xl transition-colors disabled:opacity-40"
                style={{ color: "#8A97A3" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#f1f5f9";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#334155";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#8A97A3";
                }}
              >
                {isUploading ? (
                  <div
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: "rgba(107,207,122,0.2)",
                      borderTopColor: "#6BCF7A",
                    }}
                  />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </button>

              <div className="flex-1 relative">
                {mentionQuery !== null && (
                  <MentionPicker
                    query={mentionQuery}
                    onSelect={completeMention}
                  />
                )}
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={handleMessageChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… @admin, @client, @AI"
                  rows={1}
                  disabled={isSending}
                  className="w-full px-4 py-3 rounded-2xl resize-none focus:outline-none text-sm leading-relaxed transition-all"
                  style={{
                    background: "rgba(107,207,122,0.06)",
                    border: "1px solid #DDE5EC",
                    color: "#1E2A32",
                    minHeight: "44px",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6BCF7A";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(107,207,122,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#DDE5EC";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <button
                onClick={sendMessage}
                disabled={
                  isSending ||
                  (!newMessage.trim() && pendingAttachments.length === 0)
                }
                className="w-10 h-10 rounded-2xl flex items-center justify-center p-0 transition-all duration-150 active:scale-95 flex-shrink-0 disabled:opacity-40"
                style={{ background: "#6BCF7A", color: "white" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#5ab868";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#6BCF7A";
                }}
              >
                {isSending ? (
                  <div
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: "rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                    }}
                  />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] mt-2 px-1" style={{ color: "#8A97A3" }}>
              <kbd
                className="px-1 py-0.5 rounded text-[10px]"
                style={{ background: "#f1f5f9", color: "#5F6B76" }}
              >
                Enter
              </kbd>{" "}
              to send ·{" "}
              <kbd
                className="px-1 py-0.5 rounded text-[10px]"
                style={{ background: "#f1f5f9", color: "#5F6B76" }}
              >
                Shift+Enter
              </kbd>{" "}
              for new line
            </p>
          </div>
        </div>
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
