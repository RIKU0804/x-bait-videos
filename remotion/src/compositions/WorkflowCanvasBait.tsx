import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { WorkflowNode, getPort, NodeIcon } from "../components/WorkflowNode";
import { Connection } from "../components/Connection";
import { CinematicBackground } from "../components/CinematicBackground";
import { NotificationToast } from "../components/NotificationToast";
import { InspectorPanel } from "../components/InspectorPanel";
import { SidebarPanel } from "../components/SidebarPanel";

// ========== レイアウト ==========
// 1920x1080
// Sidebar: 24-204 (180wide)   Inspector: 1620-1900 (280wide)
// Workflow zone: 230-1600 (1370 wide)
// 6 stages × 180 width + 5 × ~58 gap

const NODE_W = 180;
const NODE_H = 80;

// カラム位置
const COL = [230, 466, 702, 938, 1174, 1410]; // 6 stages

type NodeDef = {
  id: string;
  x: number;
  y: number;
  icon: NodeIcon;
  title: string;
  subtitle: string;
  appearAt: number;
  execAt: number;
};

// ========== ノード定義 ==========
const NODES: NodeDef[] = [
  // Col 1: Triggers
  { id: "schedule", x: COL[0], y: 460, icon: "schedule", title: "Schedule",   subtitle: "30 min",       appearAt: 30,  execAt: 130 },
  { id: "webhook",  x: COL[0], y: 560, icon: "webhook",  title: "Webhook",    subtitle: "POST /run",    appearAt: 34,  execAt: 130 },

  // Col 2: Data fetch (3 parallel)
  { id: "trends",   x: COL[1], y: 360, icon: "http",     title: "Trends",     subtitle: "X analytics",  appearAt: 42,  execAt: 162 },
  { id: "history",  x: COL[1], y: 460, icon: "http",     title: "History",    subtitle: "past 100",     appearAt: 46,  execAt: 167 },
  { id: "metrics",  x: COL[1], y: 560, icon: "http",     title: "Metrics",    subtitle: "engagement",   appearAt: 50,  execAt: 170 },

  // Col 3: AI processing
  { id: "vector",   x: COL[2], y: 410, icon: "vector",   title: "RAG Search", subtitle: "pgvector",     appearAt: 58,  execAt: 198 },
  { id: "claude",   x: COL[2], y: 510, icon: "claude",   title: "Claude 4.7", subtitle: "viral gen",    appearAt: 62,  execAt: 230 },

  // Col 4: Content generation (3 parallel)
  { id: "image",    x: COL[3], y: 360, icon: "gemini",   title: "Imagen",     subtitle: "1024×1024",    appearAt: 72,  execAt: 268 },
  { id: "text",     x: COL[3], y: 460, icon: "openai",   title: "Variants",   subtitle: "3 versions",   appearAt: 76,  execAt: 272 },
  { id: "caption",  x: COL[3], y: 560, icon: "translate",title: "Caption",    subtitle: "subtitles",    appearAt: 80,  execAt: 276 },

  // Col 5: Multi-platform publish (6 parallel — 圧巻パート)
  { id: "x",        x: COL[4], y: 200, icon: "x",         title: "X",         subtitle: "@your_acc",    appearAt: 88,  execAt: 310 },
  { id: "threads",  x: COL[4], y: 300, icon: "threads",   title: "Threads",   subtitle: "thread×3",     appearAt: 92,  execAt: 314 },
  { id: "ig",       x: COL[4], y: 400, icon: "instagram", title: "Instagram", subtitle: "queue",        appearAt: 96,  execAt: 318 },
  { id: "note",     x: COL[4], y: 500, icon: "note",      title: "note",      subtitle: "2,431字",       appearAt: 100, execAt: 322 },
  { id: "tiktok",   x: COL[4], y: 600, icon: "tiktok",    title: "TikTok",    subtitle: "+ subs",       appearAt: 104, execAt: 326 },
  { id: "linkedin", x: COL[4], y: 700, icon: "linkedin",  title: "LinkedIn",  subtitle: "EN post",      appearAt: 108, execAt: 330 },

  // Col 6: Storage + notify
  { id: "supabase", x: COL[5], y: 380, icon: "supabase",  title: "Supabase",  subtitle: "posts table",  appearAt: 118, execAt: 380 },
  { id: "analytics",x: COL[5], y: 480, icon: "analytics", title: "Analytics", subtitle: "track all",    appearAt: 122, execAt: 405 },
  { id: "slack",    x: COL[5], y: 580, icon: "slack",     title: "Slack",     subtitle: "#growth",      appearAt: 126, execAt: 420 },
];

const NODES_MAP = Object.fromEntries(NODES.map((n) => [n.id, n]));

// ========== 接続 ==========
type ConnDef = { from: string; to: string; execAt: number; packets?: number };
const CONNECTIONS: ConnDef[] = [
  // Triggers → Data
  { from: "schedule", to: "trends",   execAt: 148 },
  { from: "schedule", to: "history",  execAt: 152 },
  { from: "schedule", to: "metrics",  execAt: 156 },
  { from: "webhook",  to: "trends",   execAt: 158 },

  // Data → AI
  { from: "trends",   to: "vector",   execAt: 183 },
  { from: "history",  to: "vector",   execAt: 187 },
  { from: "metrics",  to: "claude",   execAt: 192 },
  { from: "vector",   to: "claude",   execAt: 218 },

  // AI → Generate
  { from: "claude",   to: "image",    execAt: 254 },
  { from: "claude",   to: "text",     execAt: 258 },
  { from: "claude",   to: "caption",  execAt: 262 },

  // Generate → Publish
  { from: "image",    to: "x",        execAt: 295 },
  { from: "image",    to: "threads",  execAt: 299 },
  { from: "image",    to: "ig",       execAt: 303 },
  { from: "text",     to: "note",     execAt: 306 },
  { from: "text",     to: "linkedin", execAt: 308 },
  { from: "caption",  to: "tiktok",   execAt: 312 },

  // Publish → Supabase
  { from: "x",        to: "supabase", execAt: 360 },
  { from: "threads",  to: "supabase", execAt: 363 },
  { from: "ig",       to: "supabase", execAt: 366 },
  { from: "note",     to: "supabase", execAt: 369 },
  { from: "tiktok",   to: "supabase", execAt: 372 },
  { from: "linkedin", to: "supabase", execAt: 375 },

  // Supabase → Analytics + Slack
  { from: "supabase", to: "analytics",execAt: 396 },
  { from: "supabase", to: "slack",    execAt: 408 },
];

const ACTIVE_DURATION = 22;

// ========== トースト ==========
const TOAST_TIMING = [
  { frame: 340, title: "Posted to X",       subtitle: "engagement 8.2k expected", icon: "𝕏",  iconBg: "#000" },
  { frame: 348, title: "Posted to Threads", subtitle: "thread of 3 posts",        icon: "@",  iconBg: "#000" },
  { frame: 356, title: "Posted to Instagram", subtitle: "scheduled · 19:00 JST",  icon: "◉",  iconBg: "linear-gradient(135deg, #f58529, #dd2a7b, #8134af)" },
  { frame: 364, title: "note published",    subtitle: "2,431 chars",              icon: "n",  iconBg: "#41c9b4" },
  { frame: 372, title: "TikTok uploaded",   subtitle: "with subtitles",           icon: "♪",  iconBg: "linear-gradient(135deg, #25f4ee, #fe2c55)" },
  { frame: 380, title: "LinkedIn posted",   subtitle: "EN translation",           icon: "in", iconBg: "#0a66c2" },
];

export const WorkflowCanvasBait: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const executionCount = Math.max(1, Math.floor((frame - 100) / 30) + 1);

  // ===== イントロ =====
  const introOpacity = interpolate(frame, [0, 15, 25, 30], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const introTitleY = interpolate(frame, [0, 18], [20, 0], { extrapolateRight: "clamp" });
  const introTitleScale = spring({ frame, fps, config: { damping: 18, stiffness: 70 } });

  // ===== UI =====
  const headerOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });
  const headerY = interpolate(frame, [15, 30], [-30, 0], { extrapolateRight: "clamp" });
  const footerOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const footerY = interpolate(frame, [20, 35], [30, 0], { extrapolateRight: "clamp" });

  // ===== アウトロ =====
  const outroProgress = spring({ frame: frame - 440, fps, config: { damping: 14, stiffness: 80 } });
  const showOutro = frame >= 440;

  // Inspector パネル表示期間 (Claude実行中のみ)
  const inspectorVisible = frame >= 130 && frame < 400;

  return (
    <AbsoluteFill style={{ background: "#06060c", fontFamily: "system-ui, -apple-system" }}>
      <CinematicBackground />

      {/* ======== イントロ ======== */}
      {introOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: introOpacity,
            transform: `translateY(${introTitleY}px)`,
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              transform: `scale(${introTitleScale})`,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                background: "linear-gradient(135deg, #ff6d5a, #ff8674)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 900,
                fontSize: 40,
                boxShadow: "0 0 60px rgba(255, 109, 90, 0.6), inset 0 0 0 1px rgba(255,255,255,0.18)",
              }}
            >
              ⚡
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: 56, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>
                x-auto-publisher
              </div>
              <div
                style={{
                  color: "#64748b",
                  fontSize: 16,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 6,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                }}
              >
                19 nodes · 25 connections · 8 platforms
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======== ヘッダー ======== */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          right: 24,
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 22px",
          background: "rgba(20, 20, 28, 0.86)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "linear-gradient(135deg, #ff6d5a, #ff8674)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 900,
              fontSize: 18,
              boxShadow: "0 0 14px rgba(255, 109, 90, 0.4)",
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, lineHeight: 1.1 }}>
              x-auto-publisher
            </div>
            <div style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace", marginTop: 1 }}>
              riku / production / v2.4.1
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 22, color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>
          <span>Editor</span>
          <span style={{ color: "#fff", fontWeight: 600, position: "relative" }}>
            Executions
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -10,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 8px #4ade80",
              }}
            />
          </span>
          <span>Credentials</span>
          <span>Settings</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>
            Saved {Math.floor(frame / 30)}s ago
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 12px",
              background: "rgba(74, 222, 128, 0.1)",
              border: "1px solid rgba(74, 222, 128, 0.3)",
              borderRadius: 100,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 8px #4ade80",
                opacity: Math.sin(frame * 0.15) * 0.4 + 0.6,
              }}
            />
            <span
              style={{
                color: "#4ade80",
                fontFamily: "monospace",
                fontSize: 11,
                letterSpacing: 2,
                fontWeight: 700,
              }}
            >
              ACTIVE
            </span>
          </div>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #a78bfa, #f472b6)",
              border: "2px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            R
          </div>
        </div>
      </div>

      {/* ======== サイドバー ======== */}
      <SidebarPanel appearFrame={70} />

      {/* ======== SVG 接続線 ======== */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {CONNECTIONS.map((c) => {
          const fromN = NODES_MAP[c.from];
          const toN = NODES_MAP[c.to];
          const from = getPort(fromN.x, fromN.y, NODE_W, NODE_H, "right");
          const to = getPort(toN.x, toN.y, NODE_W, NODE_H, "left");
          const appearF = Math.max(fromN.appearAt, toN.appearAt) + 6;

          return (
            <Connection
              key={`${c.from}-${c.to}`}
              from={from}
              to={to}
              appearFrame={appearF}
              activeFrame={c.execAt}
              activeDuration={ACTIVE_DURATION}
              packetCount={c.packets ?? 1}
            />
          );
        })}
      </svg>

      {/* ======== ノード ======== */}
      {NODES.map((n) => (
        <WorkflowNode
          key={n.id}
          x={n.x}
          y={n.y}
          width={NODE_W}
          height={NODE_H}
          icon={n.icon}
          title={n.title}
          subtitle={n.subtitle}
          appearFrame={n.appearAt}
          activeFrame={n.execAt}
          activeDuration={ACTIVE_DURATION}
          executionCount={executionCount}
          flow="horizontal"
        />
      ))}

      {/* ======== インスペクタ ======== */}
      {inspectorVisible && (
        <InspectorPanel appearFrame={130} streamStartFrame={230} streamEndFrame={330} />
      )}

      {/* ======== トースト ======== */}
      {TOAST_TIMING.map((t, i) => (
        <NotificationToast
          key={i}
          appearFrame={t.frame}
          title={t.title}
          subtitle={t.subtitle}
          icon={t.icon}
          iconBg={t.iconBg}
          stackIndex={i}
          duration={80}
        />
      ))}

      {/* ======== フッター ======== */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          right: 24,
          height: 88,
          padding: "16px 28px",
          background: "rgba(20, 20, 28, 0.86)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: footerOpacity,
          transform: `translateY(${footerY}px)`,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ display: "flex", gap: 36 }}>
          {[
            { label: "Executions today", value: Math.floor(frame / 6) + 1247, color: "#ff6d5a", fmt: (n: number) => n.toLocaleString() },
            { label: "Posts published",  value: Math.floor(frame / 8) + 487,  color: "#4ade80", fmt: (n: number) => n.toLocaleString() },
            { label: "Platforms",        value: 8,                            color: "#60a5fa", fmt: (n: number) => `${n}` },
            { label: "Avg duration",     value: 1.4,                          color: "#a78bfa", fmt: (n: number) => `${n.toFixed(1)}s` },
            { label: "Followers · 24h",  value: Math.floor(frame / 18) + 184, color: "#fbbf24", fmt: (n: number) => `+${n.toLocaleString()}` },
            { label: "Revenue · MTD",    value: Math.floor(frame / 5) * 100 + 487000, color: "#f472b6", fmt: (n: number) => `¥${n.toLocaleString()}` },
          ].map((s, i) => (
            <div key={i}>
              <div
                style={{
                  color: "#64748b",
                  fontSize: 10,
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  color: s.color,
                  fontSize: 24,
                  fontWeight: 800,
                  fontFamily: "system-ui",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {s.fmt(s.value)}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: "10px 18px",
            background: "linear-gradient(135deg, #ff6d5a, #ff8674)",
            borderRadius: 10,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 0 18px rgba(255, 109, 90, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>▶</span>
          Workflow Running
        </div>
      </div>

      {/* ======== アウトロスタンプ ======== */}
      {showOutro && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              transform: `scale(${outroProgress}) rotate(${interpolate(outroProgress, [0, 1], [-8, -3])}deg)`,
              opacity: outroProgress,
              padding: "32px 64px",
              background: "rgba(74, 222, 128, 0.12)",
              border: "3px solid rgba(74, 222, 128, 0.6)",
              borderRadius: 20,
              backdropFilter: "blur(20px)",
              boxShadow: "0 0 80px rgba(74, 222, 128, 0.4), inset 0 0 40px rgba(74, 222, 128, 0.06)",
            }}
          >
            <div
              style={{
                color: "#4ade80",
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: 6,
                fontFamily: "'JetBrains Mono', monospace",
                textShadow: "0 0 20px rgba(74, 222, 128, 0.6)",
              }}
            >
              ✓  WORKFLOW COMPLETE
            </div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: 14,
                marginTop: 8,
                fontFamily: "monospace",
                letterSpacing: 2,
                textAlign: "center",
              }}
            >
              8 platforms · 6 posts · 0 minutes of work ☕
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
