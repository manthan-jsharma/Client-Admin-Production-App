"use client";

import React, { useState, useEffect, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Sparkles, Bell, ArrowRight } from "lucide-react";

const PARTICLES = [
  { tx: "0px", ty: "-60px", color: "#3A8DDE" },
  { tx: "42px", ty: "-42px", color: "#6BCF7A" },
  { tx: "60px", ty: "0px", color: "#f59e0b" },
  { tx: "42px", ty: "42px", color: "#8b5cf6" },
  { tx: "0px", ty: "60px", color: "#3A8DDE" },
  { tx: "-42px", ty: "42px", color: "#6BCF7A" },
  { tx: "-60px", ty: "0px", color: "#f59e0b" },
  { tx: "-42px", ty: "-42px", color: "#8b5cf6" },
];

type Phase = "checking" | "intro" | "exiting" | "done";

export default function AINotifyShowcase() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [textIdx, setTextIdx] = useState(0);
  const [showIcon, setShowIcon] = useState(false);

  // 3D Tilt State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Inject the "Outfit" font
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Check if they have seen the intro before
    const seen = localStorage.getItem("ai_notify_welcome_seen");

    if (seen) {
      // If returning user, skip straight to the main portal
      setPhase("done");
      return;
    }

    // If new user, start the intro sequence
    setPhase("intro");

    const t1 = setTimeout(() => setTextIdx(1), 1800);
    const t2 = setTimeout(() => setTextIdx(2), 3600);
    const t3 = setTimeout(() => {
      setTextIdx(3);
      setTimeout(() => setShowIcon(true), 400);
    }, 5400);

    const exitTimer = setTimeout(() => setPhase("exiting"), 7600);
    const doneTimer = setTimeout(() => {
      setPhase("done");
      localStorage.setItem("ai_notify_welcome_seen", "true"); // Mark as seen
    }, 8200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
      document.head.removeChild(link);
    };
  }, []);

  // Since it only plays once, we don't need the "Welcome Back" text anymore
  const textSequence = [
    "Welcome",
    "Your Project Roadmaps",
    "Your Deliveries & Milestones",
    "Instant Notifications",
  ];

  // --- 3D Tilt & Extreme Glare Logic ---
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isHovering) setIsHovering(true);
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ x: rotateX, y: rotateY });
    setGlare({ x: glareX, y: glareY });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50 });
  };

  // Prevent flash while checking localStorage
  if (phase === "checking") {
    return <div className="min-h-screen bg-[#F8FAFC]" />;
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes textFadeInOut {
          0% { opacity: 0; transform: translateY(12px) scale(0.95); filter: blur(8px); }
          15% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          85% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          100% { opacity: 0; transform: translateY(-12px) scale(1.05); filter: blur(8px); }
        }
        @keyframes textFadeIn {
          0% { opacity: 0; transform: translateY(12px) scale(0.95); filter: blur(8px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes gpayPop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes gpayRing {
          0% { transform: scale(1); opacity: 0.8; border-width: 3px; }
          100% { transform: scale(4); opacity: 0; border-width: 0px; }
        }
        @keyframes scatter {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          40% { transform: translate(var(--tx), var(--ty)) scale(1.2); opacity: 1; }
          100% { transform: translate(calc(var(--tx) * 1.5), calc(var(--ty) * 1.5)) scale(0); opacity: 0; }
        }
        @keyframes exitFade {
          0% { opacity: 1; filter: blur(0); transform: scale(1); }
          100% { opacity: 0; filter: blur(12px); transform: scale(1.05); }
        }
        @keyframes settleUp {
          0% { transform: translateY(40px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `,
        }}
      />

      {/* ── 1. CINEMATIC INTRO SCREEN (ONLY PLAYS ONCE) ── */}
      {(phase === "intro" || phase === "exiting") && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F8FAFC]"
          style={{
            animation:
              phase === "exiting"
                ? "exitFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                : "none",
          }}
        >
          {showIcon && (
            <div
              className="relative flex items-center justify-center mb-8"
              style={{ width: 80, height: 80 }}
            >
              <div
                className="absolute w-20 h-20 rounded-full border-[#3A8DDE] opacity-0"
                style={{
                  animation:
                    "gpayRing 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards",
                }}
              />
              <div
                className="absolute w-20 h-20 rounded-full border-[#8b5cf6] opacity-0"
                style={{
                  animation:
                    "gpayRing 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards",
                }}
              />

              {PARTICLES.map((p, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full opacity-0"
                  style={
                    {
                      "--tx": p.tx,
                      "--ty": p.ty,
                      background: p.color,
                      boxShadow: `0 0 8px ${p.color}`,
                      animation: `scatter 1s cubic-bezier(0.16, 1, 0.3, 1) ${
                        0.4 + i * 0.05
                      }s forwards`,
                    } as React.CSSProperties
                  }
                />
              ))}

              <div
                className="relative w-20 h-20 rounded-[1.25rem] flex items-center justify-center opacity-0 z-10"
                style={{
                  background:
                    "linear-gradient(135deg, #4DA3F5 0%, #3A8DDE 100%)",
                  boxShadow:
                    "0 12px 24px rgba(58,141,222,0.3), inset 0 2px 4px rgba(255,255,255,0.4)",
                  border: "1.5px solid rgba(255,255,255,0.8)",
                  animation:
                    "gpayPop 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                }}
              >
                <Bell className="w-8 h-8 text-white drop-shadow-sm transform -rotate-12" />
                <Sparkles className="w-4 h-4 text-amber-300 absolute top-2 right-2 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
              </div>
            </div>
          )}

          <h1
            key={textIdx}
            className="text-3xl sm:text-5xl font-black text-center px-6 absolute"
            style={{
              background: "linear-gradient(135deg, #FF9800 0%, #4DA3F5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.06em",
              lineHeight: 1.1,
              animation:
                textIdx === 3
                  ? "textFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                  : "textFadeInOut 1.8s ease-in-out forwards",
              top: showIcon ? "auto" : "50%",
              transform: showIcon ? "none" : "translateY(-50%)",
              marginTop: showIcon ? "120px" : "0",
            }}
          >
            {textSequence[textIdx]}
          </h1>
        </div>
      )}

      {/* ── 2. MAIN SHOWCASE PORTAL ── */}
      {phase === "done" && (
        <div
          className="min-h-screen relative overflow-hidden flex flex-col bg-[#E9EEF2] bg-[url('/noise.png')] bg-repeat"
          style={{
            animation: "settleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          {/* Ambient Background Orbs */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
            <div
              className="absolute w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full bg-[#3A8DDE] mix-blend-normal"
              style={{
                marginTop: "-250px",
                marginLeft: "-300px",
                filter: "blur(100px)",
                WebkitFilter: "blur(100px)",
                animation: "pulseGlow 8s infinite alternate",
              }}
            />
            <div
              className="absolute w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full bg-[#FF9800] mix-blend-normal"
              style={{
                marginTop: "150px",
                marginLeft: "200px",
                filter: "blur(100px)",
                WebkitFilter: "blur(100px)",
                animation: "pulseGlow 10s infinite alternate-reverse",
              }}
            />
          </div>

          <div className="relative z-10 w-full">
            <PageHeader
              title="AI Notify Engine"
              subtitle="Stay connected, never miss a project update"
              breadcrumbs={[
                { label: "Dashboard", href: "/dashboard/client" },
                { label: "AI Notify" },
              ]}
              heroStrip
            />
          </div>

          <div
            className="max-w-2xl mx-auto p-4 sm:p-10 mt-4 w-full relative z-10 flex-1 flex flex-col items-center"
            style={{ perspective: "1500px" }}
          >
            {/* Premium 3D GLASS Card */}
            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative overflow-hidden rounded-[2.5rem] p-10 sm:p-14 flex flex-col items-center text-center transition-all duration-300 ease-out group w-full"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 100%)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                boxShadow: isHovering
                  ? "0 50px 100px -20px rgba(15,23,42,0.25), 0 30px 60px -30px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.8), inset 0 20px 40px rgba(255,255,255,0.5)"
                  : "0 25px 50px -12px rgba(15,23,42,0.15), 0 15px 30px -15px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.5), inset 0 10px 20px rgba(255,255,255,0.3)",
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${
                  isHovering
                    ? "scale3d(1.025, 1.025, 1.025)"
                    : "scale3d(1, 1, 1)"
                }`,
                transformStyle: "preserve-3d",
              }}
            >
              {/* DYNAMIC GLARE */}
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50"
                style={{
                  background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.6) 0%, transparent 60%)`,
                  mixBlendMode: "overlay",
                }}
              />

              <div
                className="relative mb-8"
                style={{ transform: "translateZ(60px)" }}
              >
                <div className="absolute -inset-4 rounded-full border border-brand/20 animate-[spin_8s_linear_infinite]" />
                <div className="absolute -inset-8 rounded-full border border-brand/10 animate-[spin_12s_linear_reverse_infinite] opacity-50" />

                <div
                  className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #4DA3F5 0%, #3A8DDE 100%)",
                    boxShadow:
                      "0 16px 32px rgba(58,141,222,0.25), inset 0 2px 4px rgba(255,255,255,0.6)",
                    border: "1.5px solid rgba(255,255,255,0.9)",
                  }}
                >
                  <Bell className="w-8 h-8 text-white drop-shadow-sm transform -rotate-12" />
                  <Sparkles className="w-4 h-4 text-amber-300 absolute top-2 right-2 animate-pulse" />
                </div>
              </div>

              <h2
                className="text-2xl sm:text-3xl font-black text-[#1E2A32] mb-4 tracking-tight"
                style={{
                  transform: "translateZ(40px)",
                  letterSpacing: "-0.04em",
                }}
              >
                Live Delivery Alerts
              </h2>

              <p
                className="text-[#5F6B76] text-sm sm:text-base leading-relaxed max-w-sm mb-10"
                style={{ transform: "translateZ(30px)" }}
              >
                AI Notify bridges the gap between your dashboard and your phone.
                Receive instant alerts the moment work is submitted.
              </p>

              {/* Main Action CTA */}
              <button
                onClick={() => router.push("/dashboard/client")}
                className="group relative w-full max-w-sm h-14 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-3 overflow-hidden transition-all active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, #4DA3F5 0%, #3A8DDE 100%)",
                  boxShadow: "0 10px 24px rgba(58,141,222,0.35)",
                  transform: "translateZ(50px)",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer-pass 2.5s linear infinite",
                  }}
                />
                Go to Dashboard to Enable
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </button>

              <p
                className="text-[10px] text-[#8A97A3] mt-5 uppercase tracking-widest font-bold"
                style={{ transform: "translateZ(15px)" }}
              >
                Look for the AI Notify button · top right
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
