import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
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

const NODE_W = 180;
const NODE_H = 80;

// カラム位置
const COL = [230, 466, 702, 938, 1174, 1410];

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
// 出現は最初から (appearAt=0)。「いま開いたら既に動いてる」状態を演出。
const NODES: NodeDef[] = [
  { id: "schedule", x: COL[0], y: 460, icon: "schedule", title: "Schedule",   subtitle: "30 min",       appearAt: 0,  execAt: 90 },
  { id: "webhook",  x: COL[0], y: 560, icon: "webhook",  title: "Webhook",    subtitle: "POST /run",    appearAt: 0,  execAt: 90 },

  { id: "trends",   x: COL[1], y: 360, icon: "http",     title: "Trends",     subtitle: "X analytics",  appearAt: 0,  execAt: 120 },
  { id: "history",  x: COL[1], y: 460, icon: "http",     title: "History",    subtitle: "past 100",     appearAt: 0,  execAt: 125 },
  { id: "metrics",  x: COL[1], y: 560, icon: "http",     title: "Metrics",    subtitle: "engagement",   appearAt: 0,  execAt: 128 },

  { id: "vector",   x: COL[2], y: 410, icon: "vector",   title: "RAG Search", subtitle: "pgvector",     appearAt: 0,  execAt: 158 },
  { id: "claude",   x: COL[2], y: 510, icon: "claude",   title: "Claude 4.5", subtitle: "viral gen",    appearAt: 0,  execAt: 188 },

  { id: "image",    x: COL[3], y: 360, icon: "gemini",   title: "Imagen",     subtitle: "1024×1024",    appearAt: 0,  execAt: 228 },
  { id: "text",     x: COL[3], y: 460, icon: "openai",   title: "Variants",   subtitle: "3 versions",   appearAt: 0,  execAt: 232 },
  { id: "caption",  x: COL[3], y: 560, icon: "translate",title: "Caption",    subtitle: "subtitles",    appearAt: 0,  execAt: 236 },

  { id: "x",        x: COL[4], y: 200, icon: "x",         title: "X",         subtitle: "@your_acc",    appearAt: 0,  execAt: 270 },
  { id: "threads",  x: COL[4], y: 300, icon: "threads",   title: "Threads",   subtitle: "thread×3",     appearAt: 0,  execAt: 274 },
  { id: "ig",       x: COL[4], y: 400, icon: "instagram", title: "Instagram", subtitle: "queue",        appearAt: 0,  execAt: 278 },
  { id: "note",     x: COL[4], y: 500, icon: "note",      title: "note",      subtitle: "2,431字",       appearAt: 0,  execAt: 282 },
  { id: "tiktok",   x: COL[4], y: 600, icon: "tiktok",    title: "TikTok",    subtitle: "+ subs",       appearAt: 0,  execAt: 286 },
  { id: "linkedin", x: COL[4], y: 700, icon: "linkedin",  title: "LinkedIn",  subtitle: "EN post",      appearAt: 0,  execAt: 290 },

  { id: "supabase", x: COL[5], y: 380, icon: "supabase",  title: "Supabase",  subtitle: "posts table",  appearAt: 0,  execAt: 340 },
  { id: "analytics",x: COL[5], y: 480, icon: "analytics", title: "Analytics", subtitle: "track all",    appearAt: 0,  execAt: 365 },
  { id: "slack",    x: COL[5], y: 580, icon: "slack",     title: "Slack",     subtitle: "#growth",      appearAt: 0,  execAt: 380 },
];

const NODES_MAP = Object.fromEntries(NODES.map((n) => [n.id, n]));

// ========== 接続 ==========
type ConnDef = { from: string; to: string; execAt: number; packets?: number };
const CONNECTIONS: ConnDef[] = [
  { from: "schedule", to: "trends",   execAt: 108 },
  { from: "schedule", to: "history",  execAt: 112 },
  { from: "schedule", to: "metrics",  execAt: 116 },
  { from: "webhook",  to: "trends",   execAt: 118 },

  { from: "trends",   to: "vector",   execAt: 143 },
  { from: "history",  to: "vector",   execAt: 147 },
  { from: "metrics",  to: "claude",   execAt: 152 },
  { from: "vector",   to: "claude",   execAt: 178 },

  { from: "claude",   to: "image",    execAt: 214 },
  { from: "claude",   to: "text",     execAt: 218 },
  { from: "claude",   to: "caption",  execAt: 222 },

  { from: "image",    to: "x",        execAt: 255 },
  { from: "image",    to: "threads",  execAt: 259 },
  { from: "image",    to: "ig",       execAt: 263 },
  { from: "text",     to: "note",     execAt: 266 },
  { from: "text",     to: "linkedin", execAt: 268 },
  { from: "caption",  to: "tiktok",   execAt: 272 },

  { from: "x",        to: "supabase", execAt: 320 },
  { from: "threads",  to: "supabase", execAt: 323 },
  { from: "ig",       to: "supabase", execAt: 326 },
  { from: "note",     to: "supabase", execAt: 329 },
  { from: "tiktok",   to: "supabase", execAt: 332 },
  { from: "linkedin", to: "supabase", execAt: 335 },

  { from: "supabase", to: "analytics",execAt: 356 },
  { from: "supabase", to: "slack",    execAt: 368 },
];

const ACTIVE_DURATION = 22;

// ========== トースト ==========
const TOAST_TIMING = [
  { frame: 300, title: "Posted to X",         subtitle: "tweet_id=1789247318472",   icon: "𝕏",  iconBg: "#000" },
  { frame: 308, title: "Posted to Threads",   subtitle: "id=t_pZx9Aq · 3 posts",    icon: "@",  iconBg: "#000" },
  { frame: 316, title: "Posted to Instagram", subtitle: "scheduled · 19:00 JST",    icon: "◉",  iconBg: "linear-gradient(135deg, #f58529, #dd2a7b, #8134af)" },
  { frame: 324, title: "note published",      subtitle: "n8f2x · 2,431 chars",      icon: "n",  iconBg: "#41c9b4" },
  { frame: 332, title: "TikTok uploaded",     subtitle: "captions.srt · 12 seg",    icon: "♪",  iconBg: "linear-gradient(135deg, #25f4ee, #fe2c55)" },
  { frame: 340, title: "LinkedIn posted",     subtitle: "EN translation · 612ms",   icon: "in", iconBg: "#0a66c2" },
];

export const WorkflowCanvasBait: React.FC = () => {
  const frame = useCurrentFrame();
  useVideoConfig();

  const executionCount = Math.max(1, Math.floor((frame - 60) / 30) + 1);

  // Inspector パネル表示期間 (Claude実行中のみ)
  const inspectorVisible = frame >= 100 && frame < 360;

  return (
    <AbsoluteFill style={{ background: "#0b0d12", fontFamily: "'Segoe UI', 'Yu Gothic UI', 'Meiryo UI', system-ui, sans-serif" }}>
      <CinematicBackground />

      {/* ======== ヘッダー (n8nっぽいツールバー) ======== */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          background: "#161922",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
        }}
      >
        {/* 左: サービス名 (地味) */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: "#ff6d5a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            n
          </div>
          <div style={{ color: "#c9d1d9", fontSize: 13, fontWeight: 500 }}>
            x-auto-publisher
          </div>
          <div
            style={{
              color: "#6b7280",
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            production
          </div>
        </div>

        {/* 中央: タブ */}
        <div
          style={{
            display: "flex",
            gap: 24,
            color: "#6b7280",
            fontSize: 13,
          }}
        >
          <span>Workflows</span>
          <span style={{ color: "#e5e7eb", fontWeight: 500 }}>Executions</span>
          <span>Credentials</span>
          <span>Settings</span>
        </div>

        {/* 右: ステータス + 保存時刻 */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              color: "#6b7280",
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            saved {Math.floor(frame / 30)}s ago
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: 4,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22c55e",
                opacity: Math.sin(frame * 0.15) * 0.3 + 0.7,
              }}
            />
            <span
              style={{
                color: "#22c55e",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              active
            </span>
          </div>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            S
          </div>
        </div>
      </div>

      {/* ======== サイドバー ======== */}
      <SidebarPanel appearFrame={0} />

      {/* ======== SVG 接続線 ======== */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {CONNECTIONS.map((c) => {
          const fromN = NODES_MAP[c.from];
          const toN = NODES_MAP[c.to];
          const from = getPort(fromN.x, fromN.y, NODE_W, NODE_H, "right");
          const to = getPort(toN.x, toN.y, NODE_W, NODE_H, "left");

          return (
            <Connection
              key={`${c.from}-${c.to}`}
              from={from}
              to={to}
              appearFrame={0}
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
        <InspectorPanel appearFrame={100} streamStartFrame={188} streamEndFrame={290} />
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

      {/* ======== フッター (ステータスバー風) ======== */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          height: 72,
          padding: "12px 22px",
          background: "#161922",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { label: "executions today",  value: Math.floor(frame / 6) + 1247,           fmt: (n: number) => n.toLocaleString() },
            { label: "posts published",   value: Math.floor(frame / 8) + 487,            fmt: (n: number) => n.toLocaleString() },
            { label: "platforms",         value: 8,                                       fmt: (n: number) => `${n}` },
            { label: "avg duration",      value: 1.4,                                     fmt: (n: number) => `${n.toFixed(1)}s` },
            { label: "followers · 24h",   value: Math.floor(frame / 18) + 184,           fmt: (n: number) => `+${n.toLocaleString()}` },
            { label: "revenue · mtd",     value: Math.floor(frame / 5) * 100 + 487000,   fmt: (n: number) => `¥${n.toLocaleString()}` },
          ].map((s, i) => (
            <div key={i}>
              <div
                style={{
                  color: "#6b7280",
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  color: "#e5e7eb",
                  fontSize: 20,
                  fontWeight: 600,
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

        {/* 右側: 実行ステータス (地味なテキストのみ) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#3b82f6",
              opacity: Math.sin(frame * 0.25) * 0.3 + 0.7,
            }}
          />
          <span
            style={{
              color: "#9ca3af",
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            running · {((frame + 60) / 30).toFixed(1)}s
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
