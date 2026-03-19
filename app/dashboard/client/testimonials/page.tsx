"use client";

import React, { useState, useEffect } from "react";
import { Testimonial } from "@/lib/types";
import {
  Star,
  Plus,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ExternalLink, Video } from "lucide-react";

const CARD = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px) saturate(1.6)",
  WebkitBackdropFilter: "blur(20px) saturate(1.6)",
  border: "1px solid rgba(255,255,255,0.55)",
  borderRadius: 16,
  boxShadow:
    "0 4px 24px rgba(30,40,60,0.08), inset 0 1px 0 rgba(255,255,255,0.85)",
};

const STATUS_CONFIG = {
  pending: {
    label: "Under Review",
    badgeStyle: {
      background: "#fffbeb",
      color: "#f59e0b",
      border: "1px solid #fde68a",
    },
    icon: Clock,
  },
  approved: {
    label: "Published",
    badgeStyle: {
      background: "rgba(107,207,122,0.1)",
      color: "#6BCF7A",
      border: "1px solid #a7f3d0",
    },
    icon: CheckCircle2,
  },
  rejected: {
    label: "Not Published",
    badgeStyle: {
      background: "rgba(58,141,222,0.06)",
      color: "#5F6B76",
      border: "1px solid #DDE5EC",
    },
    icon: ThumbsDown,
  },
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange?: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={
            onChange
              ? "cursor-pointer transition-transform hover:scale-110"
              : "cursor-default"
          }
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              n <= (hover || value) ? "fill-amber-400 text-amber-400" : ""
            }`}
            style={n > (hover || value) ? { color: "#DDE5EC" } : {}}
          />
        </button>
      ))}
    </div>
  );
}

export default function ClientTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [form, setForm] = useState({
    testimonialText: "",
    rating: 0,
    videoUrl: "",
  });
  const [errors, setErrors] = useState<{
    testimonialText?: string;
    rating?: string;
    videoUrl?: string;
  }>({});

  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch("/api/testimonials", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setTestimonials(result.data);
    } catch {
      notify("error", "Failed to load testimonials");
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.testimonialText.trim() || form.testimonialText.trim().length < 20)
      errs.testimonialText = "Please write at least 20 characters";
    if (form.rating < 1) errs.rating = "Please select a star rating";
    if (!form.videoUrl.trim())
      errs.videoUrl = "Please paste a Loom or YouTube URL";
    else if (
      !form.videoUrl.includes("loom.com") &&
      !form.videoUrl.includes("youtube.com") &&
      !form.videoUrl.includes("youtu.be")
    )
      errs.videoUrl = "Please use a Loom or YouTube URL";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) {
        setTestimonials((prev) => [result.data, ...prev]);
        setForm({ testimonialText: "", rating: 0, videoUrl: "" });
        setShowForm(false);
        notify(
          "success",
          "Testimonial submitted! It will be reviewed and published shortly."
        );
      } else notify("error", result.error || "Failed to submit testimonial");
    } catch {
      notify("error", "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasSubmitted = testimonials.length > 0;

  return (
    <div className="min-h-screen" style={{ background: "#E9EEF2" }}>
      <PageHeader
        title="Testimonial"
        subtitle="Share your experience — published testimonials are shown publicly"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/client" },
          { label: "Testimonial" },
        ]}
        heroStrip={true}
        actions={
          !hasSubmitted ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg"
              style={
                showForm
                  ? {
                      background: "rgba(255, 255, 255, 0.8)",
                      color: "#5F6B76",
                      border: "1px solid #DDE5EC",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }
                  : {
                      background:
                        "linear-gradient(135deg, #4DA3F5 0%, #3A8DDE 100%)",
                      color: "white",
                      border: "none",
                      boxShadow: "0 8px 20px rgba(58,141,222,0.3)",
                    }
              }
            >
              {showForm ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Write Testimonial</span>
                </>
              )}
            </button>
          ) : undefined
        }
      />

      <div className="p-8 space-y-5">
        {notification && (
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl text-sm font-medium"
            style={
              notification.type === "success"
                ? {
                    background: "rgba(107,207,122,0.1)",
                    border: "1px solid #a7f3d0",
                    color: "#6BCF7A",
                  }
                : {
                    background: "#fff1f2",
                    border: "1px solid #fecaca",
                    color: "#ef4444",
                  }
            }
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {notification.message}
          </div>
        )}

        {/* Info card */}
        <div
          style={{ ...CARD, border: "1px solid #c8dff0" }}
          className="overflow-hidden"
        >
          <div className="h-[3px] bg-gradient-to-r from-blue-400 via-blue-200 to-transparent" />
          <div className="p-5 flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#eff8ff", border: "1px solid #c8dff0" }}
            >
              <Star className="w-5 h-5" style={{ color: "#3A8DDE" }} />
            </div>
            <div>
              <p
                className="text-sm font-bold mb-1"
                style={{ color: "#1E2A32", fontWeight: 800 }}
              >
                Your voice matters
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "#5F6B76" }}
              >
                Share your experience working with us. Approved testimonials are
                featured on our website and marketing materials. All submissions
                are reviewed before publishing — you&apos;ll be notified of the
                outcome.
              </p>
            </div>
          </div>
        </div>

        {/* Submit form */}
        {showForm && (
          <div style={CARD} className="overflow-hidden">
            <div
              className="px-6 py-4"
              style={{ borderBottom: "1px solid #f1f5f9" }}
            >
              <h2
                className="text-sm font-semibold"
                style={{ color: "#1E2A32", fontWeight: 800 }}
              >
                Write Your Testimonial
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#8A97A3" }}>
                Your review will be visible publicly after approval
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#5F6B76" }}
                >
                  Star Rating <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <StarRating
                  value={form.rating}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, rating: v }));
                    setErrors((e) => ({ ...e, rating: "" }));
                  }}
                />
                {errors.rating && (
                  <p className="text-xs mt-1" style={{ color: "#ef4444" }}>
                    {errors.rating}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#5F6B76" }}
                  >
                    Your Testimonial <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <span className="text-[11px]" style={{ color: "#8A97A3" }}>
                    {form.testimonialText.length}/500
                  </span>
                </div>
                <textarea
                  value={form.testimonialText}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      testimonialText: e.target.value.slice(0, 500),
                    }));
                    setErrors((er) => ({ ...er, testimonialText: "" }));
                  }}
                  placeholder="Describe your experience working with us. What made the project successful? What did you appreciate most?"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none leading-relaxed transition-all focus:outline-none"
                  style={{
                    background: "rgba(58,141,222,0.06)",
                    border: errors.testimonialText
                      ? "1px solid #ef4444"
                      : "1px solid #DDE5EC",
                    color: "#1E2A32",
                  }}
                />
                {errors.testimonialText && (
                  <p className="text-xs" style={{ color: "#ef4444" }}>
                    {errors.testimonialText}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#5F6B76" }}
                >
                  Video Testimonial URL{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, videoUrl: e.target.value }));
                    setErrors((er) => ({ ...er, videoUrl: "" }));
                  }}
                  placeholder="https://www.loom.com/share/... or https://youtu.be/..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                  style={{
                    background: "rgba(58,141,222,0.06)",
                    border: errors.videoUrl
                      ? "1px solid #ef4444"
                      : "1px solid #DDE5EC",
                    color: "#1E2A32",
                  }}
                />
                {errors.videoUrl && (
                  <p className="text-xs" style={{ color: "#ef4444" }}>
                    {errors.videoUrl}
                  </p>
                )}
                <p className="text-[11px]" style={{ color: "#8A97A3" }}>
                  Paste a Loom or YouTube link — Loom recommended for best
                  quality
                </p>
              </div>
              // Inside the form buttons in
              app/dashboard/client/testimonials/page.tsx
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #4DA3F5 0%, #3A8DDE 100%)",
                    color: "white",
                    border: "none",
                    boxShadow: "0 8px 20px rgba(58,141,222,0.25)",
                  }}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 rounded-full animate-spin border-white/30 border-t-white" />
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      <span>Submit Testimonial</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 h-11 rounded-xl text-sm font-semibold transition-all active:scale-95"
                  style={{
                    background: "rgba(58,141,222,0.06)",
                    color: "#5F6B76",
                    border: "1px solid #DDE5EC",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <div
              className="w-7 h-7 border-2 rounded-full animate-spin"
              style={{
                borderColor: "rgba(58,141,222,0.2)",
                borderTopColor: "#3A8DDE",
              }}
            />
            <p className="text-xs" style={{ color: "#8A97A3" }}>
              Loading…
            </p>
          </div>
        ) : testimonials.length === 0 ? (
          <EmptyState
            variant="generic"
            title="No testimonial submitted yet"
            description="Share your experience with the team"
          >
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #4DA3F5 0%, #3A8DDE 100%)",
                color: "white",
                border: "none",
                boxShadow: "0 8px 24px rgba(58,141,222,0.3)",
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Write Testimonial</span>
            </button>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {testimonials.map((t) => {
              const sc = STATUS_CONFIG[t.status];
              const StatusIcon = sc.icon;
              return (
                <div
                  key={t._id}
                  style={{
                    ...CARD,
                    border:
                      t.status === "approved"
                        ? "1px solid #a7f3d0"
                        : "1px solid #DDE5EC",
                  }}
                  className="overflow-hidden transition-all"
                >
                  {t.status === "approved" && (
                    <div className="h-[3px] bg-gradient-to-r from-emerald-400 via-emerald-200 to-transparent" />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-4 h-4 ${
                              n <= t.rating
                                ? "fill-amber-400 text-amber-400"
                                : ""
                            }`}
                            style={n > t.rating ? { color: "#DDE5EC" } : {}}
                          />
                        ))}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
                          t.status === "approved"
                            ? "pill-info"
                            : t.status === "pending"
                            ? "pill-pending"
                            : "pill-rejected"
                        }`}
                        style={sc.badgeStyle}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>
                    <blockquote
                      className="text-sm leading-relaxed italic pl-4 mb-4"
                      style={{
                        color: "#334155",
                        borderLeft: "2px solid #DDE5EC",
                      }}
                    >
                      &quot;{t.testimonialText}&quot;
                    </blockquote>
                    {t.videoUrl &&
                      (() => {
                        const embedUrl = t.videoUrl.includes("loom.com")
                          ? t.videoUrl.replace("/share/", "/embed/") +
                            "?autoplay=1"
                          : t.videoUrl.includes("youtu.be")
                          ? `https://www.youtube.com/embed/${
                              t.videoUrl.split("youtu.be/")[1]?.split("?")[0]
                            }?autoplay=1`
                          : t.videoUrl.includes("youtube.com")
                          ? `https://www.youtube.com/embed/${new URLSearchParams(
                              t.videoUrl.split("?")[1]
                            ).get("v")}?autoplay=1`
                          : null;
                        return (
                          <div className="mb-4">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Video
                                className="w-3.5 h-3.5"
                                style={{ color: "#3A8DDE" }}
                              />
                              <span
                                className="text-xs font-medium"
                                style={{ color: "#3A8DDE" }}
                              >
                                Video Testimonial
                              </span>
                            </div>
                            {embedUrl ? (
                              <div
                                className="aspect-video rounded-xl overflow-hidden"
                                style={{ border: "1px solid #DDE5EC" }}
                              >
                                <iframe
                                  width="100%"
                                  height="100%"
                                  src={embedUrl}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <a
                                href={t.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                                style={{
                                  background: "#eff8ff",
                                  color: "#3A8DDE",
                                  border: "1px solid #c8dff0",
                                }}
                              >
                                <ExternalLink className="w-3 h-3" /> Watch Video
                              </a>
                            )}
                          </div>
                        );
                      })()}
                    <div className="flex items-center justify-between">
                      <p className="text-xs" style={{ color: "#8A97A3" }}>
                        Submitted{" "}
                        {new Date(t.createdAt!).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {t.status === "pending" && (
                        <p className="text-xs" style={{ color: "#f59e0b" }}>
                          Awaiting admin review
                        </p>
                      )}
                      {t.status === "approved" && (
                        <p
                          className="text-xs flex items-center gap-1"
                          style={{ color: "#6BCF7A" }}
                        >
                          <ThumbsUp className="w-3 h-3" /> Published
                        </p>
                      )}
                    </div>
                    {t.adminFeedback && (
                      <div
                        className="mt-3 pt-3"
                        style={{ borderTop: "1px solid #f1f5f9" }}
                      >
                        <p className="text-xs" style={{ color: "#5F6B76" }}>
                          Admin note:{" "}
                          <span style={{ color: "#334155" }}>
                            {t.adminFeedback}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
