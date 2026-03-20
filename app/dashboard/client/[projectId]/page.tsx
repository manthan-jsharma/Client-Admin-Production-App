"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Project, Delivery, SetupItem } from "@/lib/types";
import {
  ArrowLeft,
  Brain,
  Film,
  CheckCircle2,
  Circle,
  Video,
  Upload,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Package,
  AlertCircle,
  Globe,
  Palette,
  Image,
  ExternalLink,
  ClipboardList,
  Pencil,
  Save,
} from "lucide-react";

type Tab = "overview" | "roadmap" | "deliveries" | "content" | "setup";

const CARD = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px) saturate(1.6)",
  WebkitBackdropFilter: "blur(20px) saturate(1.6)",
  border: "1px solid rgba(255,255,255,0.55)",
  borderRadius: 16,
  boxShadow:
    "0 4px 24px rgba(30,40,60,0.08), inset 0 1px 0 rgba(255,255,255,0.85)",
};

const STATUS_BADGE: Record<string, React.CSSProperties> = {
  pending: {
    background: "rgba(58,141,222,0.06)",
    color: "#5F6B76",
    border: "1px solid #DDE5EC",
    borderRadius: "9999px",
    fontSize: "11px",
    padding: "2px 10px",
    fontWeight: 600,
  },
  submitted: {
    background: "#eff8ff",
    color: "#3A8DDE",
    border: "1px solid #c8dff0",
    borderRadius: "9999px",
    fontSize: "11px",
    padding: "2px 10px",
    fontWeight: 600,
  },
  client_reviewing: {
    background: "#fffbeb",
    color: "#f59e0b",
    border: "1px solid #fde68a",
    borderRadius: "9999px",
    fontSize: "11px",
    padding: "2px 10px",
    fontWeight: 600,
  },
  approved: {
    background: "rgba(107,207,122,0.1)",
    color: "#6BCF7A",
    border: "1px solid #a7f3d0",
    borderRadius: "9999px",
    fontSize: "11px",
    padding: "2px 10px",
    fontWeight: 600,
  },
  revision_requested: {
    background: "#fff1f2",
    color: "#ef4444",
    border: "1px solid #fecaca",
    borderRadius: "9999px",
    fontSize: "11px",
    padding: "2px 10px",
    fontWeight: 600,
  },
};

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1).split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("loom.com")) {
      return url.replace("/share/", "/embed/");
    }
    return null;
  } catch {
    return null;
  }
}

const UPLOAD_BADGE: Record<string, React.CSSProperties> = {
  pending_review: {
    background: "#fffbeb",
    color: "#f59e0b",
    border: "1px solid #fde68a",
    borderRadius: "9999px",
    fontSize: "11px",
    padding: "2px 10px",
    fontWeight: 600,
  },
  approved: {
    background: "rgba(107,207,122,0.1)",
    color: "#6BCF7A",
    border: "1px solid #a7f3d0",
    borderRadius: "9999px",
    fontSize: "11px",
    padding: "2px 10px",
    fontWeight: 600,
  },
  revision_requested: {
    background: "#fff1f2",
    color: "#ef4444",
    border: "1px solid #fecaca",
    borderRadius: "9999px",
    fontSize: "11px",
    padding: "2px 10px",
    fontWeight: 600,
  },
};

export default function ClientProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";

  const [project, setProject] = useState<Project | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Delivery sign-off state
  const [signingOff, setSigningOff] = useState<string | null>(null);
  const [signOffFeedback, setSignOffFeedback] = useState("");
  const [submittingSignOff, setSubmittingSignOff] = useState(false);

  // UI Design Preference
  const [showUiForm, setShowUiForm] = useState(false);
  const [uiDesignPreference, setUiDesignPreference] = useState("");
  const [submittingUi, setSubmittingUi] = useState(false);

  // Content uploads (Div B)
  const [contentForm, setContentForm] = useState({
    hdPhotoS3Key: "",
    teamSelfieVideoS3Key: "",
    domainName: "",
    designPreferences: "",
    logoS3Key: "",
  });
  const [aiCloneForm, setAiCloneForm] = useState({
    action: "" as "approved" | "rejected" | "",
    feedback: "",
  });
  const [submittingContent, setSubmittingContent] = useState(false);
  const [submittingAiClone, setSubmittingAiClone] = useState(false);

  // Setup items state
  const [setupItems, setSetupItems] = useState<SetupItem[]>([]);
  const [editingSetupId, setEditingSetupId] = useState<string | null>(null);
  const [editSetupValue, setEditSetupValue] = useState("");
  const [savingSetupId, setSavingSetupId] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setProject(result.data);
        if (result.data.uiDesignPreference)
          setUiDesignPreference(result.data.uiDesignPreference);
        setContentForm({
          hdPhotoS3Key: result.data.hdPhotoS3Key ?? "",
          teamSelfieVideoS3Key: result.data.teamSelfieVideoS3Key ?? "",
          domainName: result.data.domainName ?? "",
          designPreferences: result.data.designPreferences ?? "",
          logoS3Key: result.data.logoS3Key ?? "",
        });
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  }, [projectId, token]);

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setDeliveries(result.data);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    }
  }, [projectId, token]);

  const fetchSetupItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/setup-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setSetupItems(result.data);
    } catch (error) {
      console.error("Error fetching setup items:", error);
    }
  }, [projectId, token]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchProject(), fetchDeliveries(), fetchSetupItems()]);
      setIsLoading(false);
    };
    load();
  }, [fetchProject, fetchDeliveries, fetchSetupItems]);

  const toggleSetupItem = async (itemId: string, current: boolean) => {
    setSavingSetupId(itemId);
    try {
      const res = await fetch(`/api/setup-items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !current }),
      });
      const result = await res.json();
      if (result.success)
        setSetupItems((prev) =>
          prev.map((s) => (s._id === itemId ? result.data : s))
        );
    } catch (error) {
      console.error("Error toggling setup item:", error);
    } finally {
      setSavingSetupId(null);
    }
  };

  const saveSetupValue = async (itemId: string) => {
    if (!editSetupValue.trim()) return;
    setSavingSetupId(itemId);
    try {
      const res = await fetch(`/api/setup-items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: editSetupValue.trim(), completed: true }),
      });
      const result = await res.json();
      if (result.success) {
        setSetupItems((prev) =>
          prev.map((s) => (s._id === itemId ? result.data : s))
        );
        setEditingSetupId(null);
        setEditSetupValue("");
      }
    } catch (error) {
      console.error("Error saving setup value:", error);
    } finally {
      setSavingSetupId(null);
    }
  };

  const handleSignOff = async (
    deliveryId: string,
    action: "approve" | "request_revision"
  ) => {
    setSubmittingSignOff(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/deliveries/${deliveryId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, clientFeedback: signOffFeedback }),
        }
      );
      const result = await res.json();
      if (result.success) {
        setDeliveries((prev) =>
          prev.map((d) => (d._id === deliveryId ? result.data : d))
        );
        setSigningOff(null);
        setSignOffFeedback("");
      }
    } catch (error) {
      console.error("Error signing off:", error);
    } finally {
      setSubmittingSignOff(false);
    }
  };

  const submitUiPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingUi(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/meta`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uiDesignPreference }),
      });
      const result = await res.json();
      if (result.success) {
        setProject(result.data);
        setShowUiForm(false);
      }
    } catch (error) {
      console.error("Error submitting UI preference:", error);
    } finally {
      setSubmittingUi(false);
    }
  };

  const submitContentUploads = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingContent(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/content`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contentForm),
      });
      const result = await res.json();
      if (result.success) {
        setProject(result.data);
      }
    } catch (error) {
      console.error("Error submitting content:", error);
    } finally {
      setSubmittingContent(false);
    }
  };

  const submitAiCloneReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCloneForm.action) return;
    setSubmittingAiClone(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/content`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          aiCloneApprovalStatus: aiCloneForm.action,
          aiCloneClientFeedback: aiCloneForm.feedback,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setProject(result.data);
      }
    } catch (error) {
      console.error("Error submitting AI clone review:", error);
    } finally {
      setSubmittingAiClone(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: "rgba(58,141,222,0.2)",
            borderTopColor: "#3A8DDE",
          }}
        />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p style={{ color: "#5F6B76" }}>Project not found.</p>
        <button
          onClick={() => router.push("/dashboard/client/projects")}
          className="mt-4 btn-primary rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95"
        >
          Back
        </button>
      </div>
    );
  }

  const typeLabel =
    project.type === "ai_saas" ? "AI SaaS" : "Content Distribution";
  const TypeIcon = project.type === "ai_saas" ? Brain : Film;
  const typeIconStyle: React.CSSProperties =
    project.type === "ai_saas" ? { color: "#8b5cf6" } : { color: "#f59e0b" };
  const typeBadgeStyle: React.CSSProperties =
    project.type === "ai_saas"
      ? {
          background: "#f5f3ff",
          color: "#8b5cf6",
          border: "1px solid #ddd6fe",
          borderRadius: "9999px",
          fontSize: "11px",
          padding: "2px 10px",
          fontWeight: 600,
        }
      : {
          background: "#fffbeb",
          color: "#f59e0b",
          border: "1px solid #fde68a",
          borderRadius: "9999px",
          fontSize: "11px",
          padding: "2px 10px",
          fontWeight: 600,
        };
  const typeIconBg = project.type === "ai_saas" ? "#f5f3ff" : "#fffbeb";

  const completedDays = project.roadmap.filter((r) => r.completed).length;
  const totalDays = project.roadmap.length;
  const progress =
    totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const pendingDeliveries = deliveries.filter(
    (d) => d.status === "client_reviewing"
  ).length;

  const completedSetup = setupItems.filter((s) => s.completed).length;
  const totalSetup = setupItems.length;
  const isContentProject = project.type === "content_distribution";

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    ...(project.type === "ai_saas"
      ? [{ id: "roadmap" as Tab, label: "Roadmap" }]
      : []),
    { id: "deliveries", label: "Deliveries", badge: pendingDeliveries },
    ...(project.type === "content_distribution"
      ? [{ id: "content" as Tab, label: "My Uploads" }]
      : []),
    {
      id: "setup",
      label:
        totalSetup > 0 ? `Setup (${completedSetup}/${totalSetup})` : "Setup",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#E9EEF2" }}>
      <PageHeader
        title={project?.name || "Project"}
        subtitle="Your project overview"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/client" },
          { label: project?.name || "Project" },
        ]}
        heroStrip
      />

      {/* Sub-header: type badge + progress + tab bar */}
      <div
        className="px-8 pb-6 pt-4"
        style={{ background: "#ffffff", borderBottom: "1px solid #DDE5EC" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: typeIconBg }}
            >
              <TypeIcon className="w-4 h-4" style={typeIconStyle} />
            </div>
            <div className="flex items-center gap-2">
              <span style={typeBadgeStyle}>{typeLabel}</span>
              <span className="text-xs" style={{ color: "#8A97A3" }}>
                {project.status}
              </span>
            </div>
          </div>
          {project.type === "ai_saas" && totalDays > 0 && (
            <div className="text-right">
              <p className="text-xs" style={{ color: "#8A97A3" }}>
                Roadmap progress
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "#1E2A32", letterSpacing: "-0.02em" }}
              >
                {progress}%
              </p>
              <p className="text-xs" style={{ color: "#8A97A3" }}>
                {completedDays}/{totalDays} days
              </p>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 p-1"
          style={{
            background: "rgba(58,141,222,0.06)",
            border: "1px solid #DDE5EC",
            borderRadius: "12px",
            display: "inline-flex",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all"
              style={
                activeTab === t.id
                  ? {
                      background: "#ffffff",
                      color: "#1E2A32",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }
                  : { color: "#8A97A3" }
              }
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span
                  className="flex items-center justify-center w-4 h-4 text-white text-[10px] font-bold rounded-full"
                  style={{ background: "#f59e0b" }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Status" value={project.status} />
              <StatCard
                label="Start Date"
                value={new Date(project.startDate).toLocaleDateString()}
              />
              <StatCard
                label="End Date"
                value={new Date(project.endDate).toLocaleDateString()}
              />
              {project.totalPrice && (
                <StatCard
                  label="Total Price"
                  value={`$${project.totalPrice.toLocaleString()}`}
                />
              )}
            </div>

            <div style={{ ...CARD, padding: "20px" }}>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "#8A97A3" }}
              >
                About This Project
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#334155" }}
              >
                {project.description}
              </p>
            </div>

            {/* Contract & Scope documents */}
            {(project.contractPDF || project.scopePDF) && (
              <div style={{ ...CARD, padding: "20px" }}>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "#8A97A3" }}
                >
                  Documents
                </p>
                <div className="flex gap-3">
                  {project.contractPDF && (
                    <a
                      href={project.contractPDF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors"
                      style={{
                        background: "#eff8ff",
                        color: "#3A8DDE",
                        border: "1px solid #c8dff0",
                      }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Contract PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {project.scopePDF && (
                    <a
                      href={project.scopePDF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors"
                      style={{
                        background: "rgba(107,207,122,0.1)",
                        color: "#6BCF7A",
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Scope PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* UI Design Preference (AI SaaS) */}
            {project.type === "ai_saas" && (
              <div style={{ ...CARD, padding: "20px" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" style={{ color: "#5F6B76" }} />
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#1E2A32" }}
                    >
                      UI Design Preference
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUiForm(!showUiForm)}
                    className="rounded-xl h-8 px-3 text-xs font-medium transition-all active:scale-95"
                    style={{
                      background: "rgba(58,141,222,0.06)",
                      color: "#334155",
                      border: "1px solid #DDE5EC",
                    }}
                  >
                    {showUiForm
                      ? "Cancel"
                      : project.uiDesignPreference
                      ? "Edit"
                      : "Submit"}
                  </button>
                </div>
                {project.uiDesignPreference && !showUiForm ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: "#6BCF7A" }}
                    />
                    <span className="text-sm" style={{ color: "#334155" }}>
                      {project.uiDesignPreference}
                    </span>
                  </div>
                ) : showUiForm ? (
                  <form onSubmit={submitUiPreference} className="flex gap-3">
                    <Input
                      value={uiDesignPreference}
                      onChange={(e) => setUiDesignPreference(e.target.value)}
                      placeholder="e.g. Minimal dark theme, inspired by Linear / Notion"
                      className="rounded-xl h-9 text-sm flex-1"
                      style={{
                        background: "rgba(58,141,222,0.06)",
                        borderColor: "#DDE5EC",
                        color: "#1E2A32",
                      }}
                      required
                    />
                    <button
                      type="submit"
                      disabled={submittingUi}
                      className="btn-primary rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95 disabled:opacity-60"
                    >
                      {submittingUi ? "Saving..." : "Save"}
                    </button>
                  </form>
                ) : (
                  <p className="text-xs" style={{ color: "#8A97A3" }}>
                    Describe your preferred UI style so the dev team can match
                    your vision.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ROADMAP TAB (AI SaaS) */}
        {activeTab === "roadmap" && project.type === "ai_saas" && (
          <div className="space-y-3">
            <p className="text-xs mb-4" style={{ color: "#8A97A3" }}>
              14-day project roadmap. Each completed day includes a progress
              video from your admin.
            </p>
            {project.roadmap.map((item) => (
              <div
                key={item.day}
                style={{
                  background: item.completed ? "#f0fdf4" : "#ffffff",
                  border: item.completed
                    ? "1px solid #a7f3d0"
                    : "1px solid #DDE5EC",
                  borderLeft: item.completed
                    ? "3px solid #6BCF7A"
                    : "3px solid #DDE5EC",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  borderRadius: "16px",
                  transition: "all 0.2s",
                }}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    {item.completed ? (
                      <CheckCircle2
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: "#6BCF7A" }}
                      />
                    ) : (
                      <Circle
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: "#DDE5EC" }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold"
                          style={{ color: "#8A97A3" }}
                        >
                          DAY {item.day}
                        </span>
                        {item.completed && (
                          <span
                            className="text-xs"
                            style={{ color: "#6BCF7A" }}
                          >
                            Complete
                          </span>
                        )}
                        {!item.completed && item.videoUrl && (
                          <span
                            className="text-xs"
                            style={{ color: "#8A97A3" }}
                          >
                            Video available
                          </span>
                        )}
                      </div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "#1E2A32" }}
                      >
                        {item.title}
                      </p>
                      {item.description && (
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "#5F6B76" }}
                        >
                          {item.description}
                        </p>
                      )}

                      {/* Video embed */}
                      {item.videoUrl &&
                        item.completed &&
                        (() => {
                          const embedUrl = getEmbedUrl(item.videoUrl);
                          return (
                            <div className="mt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Video
                                  className="w-3.5 h-3.5"
                                  style={{ color: "#3A8DDE" }}
                                />
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: "#3A8DDE" }}
                                >
                                  Progress Video
                                </span>
                              </div>
                              {embedUrl ? (
                                <div
                                  className="aspect-video rounded-xl overflow-hidden"
                                  style={{
                                    background: "#f1f5f9",
                                    border: "1px solid #DDE5EC",
                                  }}
                                >
                                  <iframe
                                    width="100%"
                                    height="100%"
                                    src={embedUrl}
                                    title={`Day ${item.day} Progress`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              ) : (
                                <a
                                  href={item.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                                  style={{
                                    background: "#eff8ff",
                                    color: "#3A8DDE",
                                    border: "1px solid #c8dff0",
                                  }}
                                >
                                  <ExternalLink className="w-3 h-3" /> Watch
                                  Video
                                </a>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DELIVERIES TAB */}
        {activeTab === "deliveries" && (
          <div className="space-y-5">
            {pendingDeliveries > 0 && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
              >
                <AlertCircle
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "#f59e0b" }}
                />
                <p className="text-sm" style={{ color: "#92400e" }}>
                  You have <strong>{pendingDeliveries}</strong> delivery
                  {pendingDeliveries > 1 ? "ies" : ""} awaiting your review and
                  sign-off.
                </p>
              </div>
            )}

            {deliveries.length === 0 ? (
              <EmptyState
                icon={
                  <Package className="w-8 h-8" style={{ color: "#8A97A3" }} />
                }
                title="No deliveries yet"
                description="Your admin will add delivery cards as work progresses."
              />
            ) : (
              deliveries.map((d) => (
                <div
                  key={d._id}
                  style={{
                    background:
                      d.status === "approved"
                        ? "#f0fdf4"
                        : d.status === "client_reviewing"
                        ? "#fffbeb"
                        : "#ffffff",
                    border:
                      d.status === "approved"
                        ? "1px solid #a7f3d0"
                        : d.status === "client_reviewing"
                        ? "1px solid #fde68a"
                        : "1px solid #DDE5EC",
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)",
                    borderRadius: "16px",
                    transition: "all 0.2s",
                  }}
                  className="hover:-translate-y-0.5"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-sm font-bold"
                            style={{ color: "#3A8DDE" }}
                          >
                            D{d.deliveryNumber}
                          </span>
                          {d.status === "approved" ? (
                            <span className="pill-info">
                              {d.status.replace("_", " ")}
                            </span>
                          ) : d.status === "client_reviewing" ? (
                            <span className="pill-pending">
                              Awaiting Your Review
                            </span>
                          ) : d.status === "revision_requested" ? (
                            <span className="pill-rejected">
                              {d.status.replace("_", " ")}
                            </span>
                          ) : d.status === "pending" ? (
                            <span className="pill-pending">
                              {d.status.replace("_", " ")}
                            </span>
                          ) : (
                            <span className="pill-muted">
                              {d.status.replace("_", " ")}
                            </span>
                          )}
                        </div>
                        <h3
                          className="text-sm font-semibold"
                          style={{ color: "#1E2A32" }}
                        >
                          {d.title}
                        </h3>
                      </div>
                      {d.status === "approved" && (
                        <div
                          className="flex items-center gap-1.5"
                          style={{ color: "#6BCF7A" }}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-medium">
                            Signed Off
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs mb-4" style={{ color: "#5F6B76" }}>
                      {d.description}
                    </p>

                    {d.proofVideoUrl && (
                      <a
                        href={d.proofVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4 text-xs transition-colors"
                        style={{
                          background: "#eff8ff",
                          color: "#3A8DDE",
                          border: "1px solid #c8dff0",
                        }}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="flex-1">Watch Loom Video</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    )}

                    {d.clientFeedback && (
                      <p className="text-xs mb-3" style={{ color: "#5F6B76" }}>
                        Your feedback:{" "}
                        <span style={{ color: "#334155" }}>
                          "{d.clientFeedback}"
                        </span>
                      </p>
                    )}

                    {d.signedOffAt && (
                      <p className="text-xs" style={{ color: "#6BCF7A" }}>
                        Signed off on{" "}
                        {new Date(d.signedOffAt).toLocaleDateString()}
                      </p>
                    )}

                    {/* Sign-off panel */}
                    {d.status === "client_reviewing" && (
                      <div
                        className="mt-4 pt-4"
                        style={{ borderTop: "1px solid #f1f5f9" }}
                      >
                        {signingOff === d._id ? (
                          <div className="space-y-3">
                            <textarea
                              value={signOffFeedback}
                              onChange={(e) =>
                                setSignOffFeedback(e.target.value)
                              }
                              placeholder="Add feedback (optional)..."
                              rows={2}
                              className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none"
                              style={{
                                background: "rgba(58,141,222,0.06)",
                                border: "1px solid #DDE5EC",
                                color: "#1E2A32",
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSignOff(d._id!, "approve")}
                                disabled={submittingSignOff}
                                className="flex items-center gap-1.5 rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95 disabled:opacity-60"
                                style={{
                                  background: "rgba(107,207,122,0.1)",
                                  color: "#6BCF7A",
                                  border: "1px solid #a7f3d0",
                                }}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" /> Approve &
                                Sign Off
                              </button>
                              <button
                                onClick={() =>
                                  handleSignOff(d._id!, "request_revision")
                                }
                                disabled={submittingSignOff}
                                className="flex items-center gap-1.5 rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95 disabled:opacity-60"
                                style={{
                                  background: "#fff1f2",
                                  color: "#ef4444",
                                  border: "1px solid #fecaca",
                                }}
                              >
                                <ThumbsDown className="w-3.5 h-3.5" /> Request
                                Revision
                              </button>
                              <button
                                onClick={() => setSigningOff(null)}
                                className="rounded-xl h-9 px-3 text-sm font-medium transition-all active:scale-95"
                                style={{
                                  background: "rgba(58,141,222,0.06)",
                                  color: "#334155",
                                  border: "1px solid #DDE5EC",
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSigningOff(d._id!)}
                            className="btn-primary flex items-center gap-2 rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" /> Review & Sign Off
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CONTENT UPLOADS TAB (Content Distribution) */}
        {activeTab === "content" && project.type === "content_distribution" && (
          <div className="space-y-6">
            {/* Client Uploads */}
            <div style={{ ...CARD, overflow: "hidden" }}>
              <div
                className="px-6 py-4"
                style={{
                  borderBottom: "1px solid #f1f5f9",
                  background: "rgba(58,141,222,0.06)",
                }}
              >
                <h2
                  className="text-sm font-semibold"
                  style={{ color: "#1E2A32", fontWeight: 800 }}
                >
                  Your Uploads
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#8A97A3" }}>
                  Upload your files below — they'll be stored and delivered
                  securely
                </p>
              </div>
              <form onSubmit={submitContentUploads} className="p-6 space-y-5">
                {/* HD Photo */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4" style={{ color: "#5F6B76" }} />
                      <label
                        className="text-sm font-medium"
                        style={{ color: "#334155" }}
                      >
                        HD Photo of Yourself
                      </label>
                    </div>
                    {project.hdPhotoStatus && (
                      <span
                        style={
                          UPLOAD_BADGE[project.hdPhotoStatus] ??
                          UPLOAD_BADGE.pending_review
                        }
                      >
                        {project.hdPhotoStatus.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <FileUploadField
                    value={contentForm.hdPhotoS3Key}
                    onChange={(url) =>
                      setContentForm((f) => ({ ...f, hdPhotoS3Key: url }))
                    }
                    folder="content/hd-photos"
                    accept="image/*"
                    maxSizeMB={20}
                    hint="JPEG, PNG, or WebP · High resolution recommended"
                  />
                  {project.hdPhotoAdminFeedback && (
                    <p
                      className="text-xs mt-1.5 flex items-start gap-1.5"
                      style={{ color: "#f59e0b" }}
                    >
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{" "}
                      Admin feedback: {project.hdPhotoAdminFeedback}
                    </p>
                  )}
                </div>

                {/* Team Selfie Video */}
                <div
                  className="pt-4"
                  style={{ borderTop: "1px solid #f1f5f9" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" style={{ color: "#5F6B76" }} />
                      <label
                        className="text-sm font-medium"
                        style={{ color: "#334155" }}
                      >
                        10 Sec Selfie Video
                      </label>
                    </div>
                    {project.teamSelfieVideoStatus && (
                      <span
                        style={
                          UPLOAD_BADGE[project.teamSelfieVideoStatus] ??
                          UPLOAD_BADGE.pending_review
                        }
                      >
                        {project.teamSelfieVideoStatus.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <FileUploadField
                    value={contentForm.teamSelfieVideoS3Key}
                    onChange={(url) =>
                      setContentForm((f) => ({
                        ...f,
                        teamSelfieVideoS3Key: url,
                      }))
                    }
                    folder="content/team-selfies"
                    accept="video/mp4,video/webm,video/quicktime"
                    maxSizeMB={100}
                    hint="MP4, WebM, or MOV"
                  />
                  {project.teamSelfieVideoAdminFeedback && (
                    <p
                      className="text-xs mt-1.5 flex items-start gap-1.5"
                      style={{ color: "#f59e0b" }}
                    >
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{" "}
                      Admin feedback: {project.teamSelfieVideoAdminFeedback}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingContent}
                  className="btn-primary rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95 disabled:opacity-60"
                >
                  {submittingContent ? "Saving..." : "Save Uploads"}
                </button>
              </form>
            </div>

            {/* AI Clone Review */}
            {project.aiCloneSampleS3Key && (
              <div style={{ ...CARD, overflow: "hidden" }}>
                <div
                  className="px-6 py-4"
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: "rgba(58,141,222,0.06)",
                  }}
                >
                  <h2
                    className="text-sm font-semibold"
                    style={{ color: "#1E2A32", fontWeight: 800 }}
                  >
                    AI Clone Sample — Your Review
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <a
                    href={project.aiCloneSampleS3Key}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors group"
                    style={{
                      background: "#f5f3ff",
                      border: "1px solid #ddd6fe",
                      color: "#8b5cf6",
                    }}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="flex-1 truncate font-mono">
                      {project.aiCloneSampleS3Key.split("/").pop()}
                    </span>
                    <span className="text-[11px]">View sample ↗</span>
                  </a>

                  {project.aiCloneApprovalStatus &&
                  project.aiCloneApprovalStatus !== "pending_review" ? (
                    <div
                      className={`flex items-center gap-2`}
                      style={{
                        color:
                          project.aiCloneApprovalStatus === "approved"
                            ? "#6BCF7A"
                            : "#ef4444",
                      }}
                    >
                      {project.aiCloneApprovalStatus === "approved" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        You {project.aiCloneApprovalStatus} this AI clone
                        sample.
                      </span>
                    </div>
                  ) : (
                    <form onSubmit={submitAiCloneReview} className="space-y-3">
                      <textarea
                        value={aiCloneForm.feedback}
                        onChange={(e) =>
                          setAiCloneForm((f) => ({
                            ...f,
                            feedback: e.target.value,
                          }))
                        }
                        placeholder="Your feedback on the AI clone sample..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none"
                        style={{
                          background: "rgba(58,141,222,0.06)",
                          border: "1px solid #DDE5EC",
                          color: "#1E2A32",
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setAiCloneForm((f) => ({
                              ...f,
                              action: "approved",
                            }))
                          }
                          className="flex items-center gap-1.5 rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95"
                          style={
                            aiCloneForm.action === "approved"
                              ? {
                                  background: "rgba(107,207,122,0.1)",
                                  color: "#6BCF7A",
                                  border: "1px solid #a7f3d0",
                                }
                              : {
                                  background: "rgba(58,141,222,0.06)",
                                  color: "#334155",
                                  border: "1px solid #DDE5EC",
                                }
                          }
                        >
                          <ThumbsUp className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setAiCloneForm((f) => ({
                              ...f,
                              action: "rejected",
                            }))
                          }
                          className="flex items-center gap-1.5 rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95"
                          style={
                            aiCloneForm.action === "rejected"
                              ? {
                                  background: "#fff1f2",
                                  color: "#ef4444",
                                  border: "1px solid #fecaca",
                                }
                              : {
                                  background: "rgba(58,141,222,0.06)",
                                  color: "#334155",
                                  border: "1px solid #DDE5EC",
                                }
                          }
                        >
                          <ThumbsDown className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          type="submit"
                          disabled={!aiCloneForm.action || submittingAiClone}
                          className="btn-primary rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                        >
                          {submittingAiClone
                            ? "Submitting..."
                            : "Submit Review"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Branding Info */}
            <div style={{ ...CARD, overflow: "hidden" }}>
              <div
                className="px-6 py-4"
                style={{
                  borderBottom: "1px solid #f1f5f9",
                  background: "rgba(58,141,222,0.06)",
                }}
              >
                <h2
                  className="text-sm font-semibold"
                  style={{ color: "#1E2A32", fontWeight: 800 }}
                >
                  Branding & Delivery Info
                </h2>
              </div>
              <form onSubmit={submitContentUploads} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Globe
                        className="w-3.5 h-3.5"
                        style={{ color: "#5F6B76" }}
                      />
                      <label
                        className="text-xs font-medium"
                        style={{ color: "#334155" }}
                      >
                        Domain Name
                      </label>
                    </div>
                    <Input
                      value={contentForm.domainName}
                      onChange={(e) =>
                        setContentForm((f) => ({
                          ...f,
                          domainName: e.target.value,
                        }))
                      }
                      placeholder="yourdomain.com"
                      className="rounded-xl h-9 text-sm"
                      style={{
                        background: "rgba(58,141,222,0.06)",
                        borderColor: "#DDE5EC",
                        color: "#1E2A32",
                      }}
                    />
                  </div>
                  <div>
                    <FileUploadField
                      label="Logo"
                      value={contentForm.logoS3Key}
                      onChange={(url) =>
                        setContentForm((f) => ({ ...f, logoS3Key: url }))
                      }
                      folder="content/logos"
                      accept="image/*"
                      maxSizeMB={5}
                      hint="PNG or SVG preferred"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Palette
                      className="w-3.5 h-3.5"
                      style={{ color: "#5F6B76" }}
                    />
                    <label
                      className="text-xs font-medium"
                      style={{ color: "#334155" }}
                    >
                      Design Preferences
                    </label>
                  </div>
                  <textarea
                    value={contentForm.designPreferences}
                    onChange={(e) =>
                      setContentForm((f) => ({
                        ...f,
                        designPreferences: e.target.value,
                      }))
                    }
                    placeholder="e.g. Modern dark theme, primary color #0066FF, minimalist style..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none"
                    style={{
                      background: "rgba(58,141,222,0.06)",
                      border: "1px solid #DDE5EC",
                      color: "#1E2A32",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingContent}
                  className="btn-primary rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95 disabled:opacity-60"
                >
                  {submittingContent ? "Saving..." : "Save Branding Info"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SETUP TAB */}
        {activeTab === "setup" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "#1E2A32", fontWeight: 800 }}
                >
                  {project.type === "ai_saas"
                    ? "Project Setup — 14-Day Scope"
                    : "Project Setup — 7-Day Scope"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#8A97A3" }}>
                  {totalSetup > 0
                    ? `${completedSetup} of ${totalSetup} items completed`
                    : "Your admin will add setup items for this project shortly."}
                </p>
              </div>
              {totalSetup > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 w-32 rounded-full overflow-hidden"
                    style={{ background: "#DDE5EC" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${
                          totalSetup > 0
                            ? Math.round((completedSetup / totalSetup) * 100)
                            : 0
                        }%`,
                        background: "#6BCF7A",
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium w-8 text-right"
                    style={{ color: "#5F6B76" }}
                  >
                    {totalSetup > 0
                      ? Math.round((completedSetup / totalSetup) * 100)
                      : 0}
                    %
                  </span>
                </div>
              )}
            </div>

            {setupItems.length === 0 ? (
              <EmptyState
                icon={
                  <ClipboardList
                    className="w-8 h-8"
                    style={{ color: "#8A97A3" }}
                  />
                }
                title="No setup items yet"
                description="Your admin will populate this checklist — check back soon."
              />
            ) : (
              <div className="space-y-2">
                {setupItems.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      background: item.completed ? "#f0fdf4" : "#ffffff",
                      border: item.completed
                        ? "1px solid #a7f3d0"
                        : "1px solid #DDE5EC",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      borderRadius: "12px",
                      transition: "all 0.2s",
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Completion toggle */}
                        <button
                          onClick={() =>
                            toggleSetupItem(item._id!, item.completed)
                          }
                          disabled={savingSetupId === item._id}
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                          style={
                            item.completed
                              ? { background: "#6BCF7A" }
                              : {
                                  background: "#ffffff",
                                  border: "1px solid #DDE5EC",
                                }
                          }
                        >
                          {item.completed ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <span
                              className="text-xs font-bold"
                              style={{ color: "#8A97A3" }}
                            >
                              {item.itemNumber}
                            </span>
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium"
                            style={{
                              color: item.completed ? "#8A97A3" : "#1E2A32",
                              textDecoration: item.completed
                                ? "line-through"
                                : "none",
                            }}
                          >
                            {item.title}
                          </p>

                          {editingSetupId === item._id ? (
                            <div className="mt-2 flex gap-2">
                              <Input
                                value={editSetupValue}
                                onChange={(e) =>
                                  setEditSetupValue(e.target.value)
                                }
                                placeholder={
                                  item.completed
                                    ? "Update your response…"
                                    : item.value ??
                                      (isContentProject
                                        ? "Share/paste links to it..."
                                        : "Type your response…")
                                }
                                className="rounded-xl h-8 text-sm flex-1"
                                style={{
                                  background: "rgba(58,141,222,0.06)",
                                  borderColor: "#DDE5EC",
                                  color: "#1E2A32",
                                }}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    saveSetupValue(item._id!);
                                  if (e.key === "Escape")
                                    setEditingSetupId(null);
                                }}
                              />
                              <button
                                onClick={() => saveSetupValue(item._id!)}
                                disabled={savingSetupId === item._id}
                                className="btn-primary rounded-xl h-8 px-3 text-xs font-medium flex items-center gap-1 transition-all active:scale-95 disabled:opacity-60"
                              >
                                <Save className="w-3 h-3" /> Save
                              </button>
                              <button
                                onClick={() => setEditingSetupId(null)}
                                className="rounded-xl h-8 px-3 text-xs font-medium transition-all active:scale-95"
                                style={{
                                  background: "rgba(58,141,222,0.06)",
                                  color: "#334155",
                                  border: "1px solid #DDE5EC",
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {item.value &&
                                (item.value.startsWith("http") ||
                                  item.value.includes(".com")) ? (
                                  <div className="flex items-center gap-2 w-full">
                                    <a
                                      href={
                                        item.value.startsWith("http")
                                          ? item.value
                                          : `https://${item.value}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-semibold text-blue-500 hover:underline truncate max-w-[200px] flex items-center gap-1"
                                    >
                                      {item.value}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                    <button
                                      onClick={() =>
                                        navigator.clipboard.writeText(
                                          item.value!
                                        )
                                      }
                                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors active:scale-90"
                                      title="Copy link"
                                    >
                                      <ClipboardList className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <p
                                    className="text-xs flex-1 truncate"
                                    style={{ color: "#5F6B76" }}
                                  >
                                    {item.value ?? "—"}
                                  </p>
                                )}
                              </div>
                              {!item.completed && (
                                <button
                                  onClick={() => {
                                    setEditingSetupId(item._id!);
                                    setEditSetupValue(
                                      item.completed ? item.value ?? "" : ""
                                    );
                                  }}
                                  className="p-1 rounded transition-colors flex-shrink-0"
                                  style={{ color: "#8A97A3" }}
                                  title="Edit response"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {item.completed && item.completedAt && (
                          <span
                            className="text-[10px] flex-shrink-0 mt-1"
                            style={{ color: "#6BCF7A" }}
                          >
                            {new Date(item.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(20px) saturate(1.6)",
        WebkitBackdropFilter: "blur(20px) saturate(1.6)",
        border: "1px solid rgba(255,255,255,0.55)",
        boxShadow:
          "0 4px 24px rgba(30,40,60,0.08), inset 0 1px 0 rgba(255,255,255,0.85)",
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      <p className="text-xs mb-1" style={{ color: "#8A97A3" }}>
        {label}
      </p>
      <p
        className="text-sm font-semibold capitalize"
        style={{ color: "#1E2A32" }}
      >
        {value}
      </p>
    </div>
  );
}
