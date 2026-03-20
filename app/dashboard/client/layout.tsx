"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ToastProvider } from "@/components/ui/toast-provider";
import { CommandPaletteProvider } from "@/components/ui/command-palette";
import { Menu } from "lucide-react";

function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter flex-1 overflow-y-auto">
      {children}
    </div>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push("/login");
        return;
      }
      if (user.role === "admin") {
        router.push("/dashboard/admin");
        return;
      }
      if (user.status === "pending" || user.status === "rejected") {
        router.push("/pending");
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  useEffect(() => {
    // Only redirect if they have NEVER seen the AI Notify welcome screen
    const hasSeenNotify = localStorage.getItem("ai_notify_welcome_seen");
    if (!hasSeenNotify) {
      router.push("/dashboard/client/ai-notify");
    }
  }, [router]);
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#E9EEF2" }}
      >
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: "rgba(58,141,222,0.12)",
              border: "1px solid rgba(58,141,222,0.2)",
            }}
          >
            <img
              src="/icon.svg"
              alt="AI APP LABS"
              className="w-7 h-7 object-contain"
            />
          </div>
          <div
            className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{
              borderColor: "rgba(58,141,222,0.2)",
              borderTopColor: "#3A8DDE",
            }}
          />
        </div>
      </div>
    );
  }

  if (
    !isAuthenticated ||
    !user ||
    user.role !== "client" ||
    user.status !== "approved"
  )
    return null;

  return (
    <ToastProvider>
      <CommandPaletteProvider role="client">
        <div className="flex h-screen" style={{ background: "#E9EEF2" }}>
          <Sidebar
            mobileOpen={mobileNavOpen}
            onMobileClose={() => setMobileNavOpen(false)}
          />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Mobile top bar */}
            <div
              className="lg:hidden flex items-center gap-3 px-4 h-14 flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(221,229,236,0.7)",
              }}
            >
              <button
                onClick={() => setMobileNavOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(58,141,222,0.08)",
                  border: "1px solid rgba(58,141,222,0.15)",
                  cursor: "pointer",
                }}
              >
                <Menu size={18} color="#3A8DDE" />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img src="/icon.svg" alt="" style={{ width: 22, height: 22 }} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#1E2A32",
                    letterSpacing: "-0.02em",
                  }}
                >
                  AI APP LABS
                </span>
              </div>
            </div>
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </CommandPaletteProvider>
    </ToastProvider>
  );
}
