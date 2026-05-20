import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

export type NodeIcon =
  | "schedule"
  | "http"
  | "claude"
  | "openai"
  | "gemini"
  | "vector"
  | "x"
  | "threads"
  | "instagram"
  | "note"
  | "tiktok"
  | "linkedin"
  | "youtube"
  | "slack"
  | "discord"
  | "supabase"
  | "redis"
  | "analytics"
  | "code"
  | "merge"
  | "split"
  | "webhook"
  | "filter"
  | "translate";

// 実SaaSのブランドカラーに寄せる
const ICON_CONFIG: Record<NodeIcon, { bg: string; symbol: string }> = {
  schedule:  { bg: "#ff6d5a", symbol: "⏱" },
  http:      { bg: "#3b82f6", symbol: "↯" },
  claude:    { bg: "#cc785c", symbol: "✦" },
  openai:    { bg: "#10a37f", symbol: "✺" },
  gemini:    { bg: "linear-gradient(135deg, #4285f4, #9b72cb, #d96570)", symbol: "✧" },
  vector:    { bg: "#7c3aed", symbol: "⊞" },
  x:         { bg: "#000",    symbol: "𝕏" },
  threads:   { bg: "#000",    symbol: "@" },
  instagram: { bg: "linear-gradient(135deg, #f58529, #dd2a7b, #8134af)", symbol: "◉" },
  note:      { bg: "#41c9b4", symbol: "n" },
  tiktok:    { bg: "linear-gradient(135deg, #25f4ee, #fe2c55)", symbol: "♪" },
  linkedin:  { bg: "#0a66c2", symbol: "in" },
  youtube:   { bg: "#ff0000", symbol: "▶" },
  slack:     { bg: "#4a154b", symbol: "#" },
  discord:   { bg: "#5865f2", symbol: "♢" },
  supabase:  { bg: "#3ecf8e", symbol: "≈" },
  redis:     { bg: "#dc382d", symbol: "◈" },
  analytics: { bg: "#0ea5e9", symbol: "▦" },
  code:      { bg: "#f59e0b", symbol: "{}" },
  merge:     { bg: "#8b5cf6", symbol: "⌥" },
  split:     { bg: "#06b6d4", symbol: "⌃" },
  webhook:   { bg: "#10b981", symbol: "⇄" },
  filter:    { bg: "#eab308", symbol: "⊳" },
  translate: { bg: "#ec4899", symbol: "文" },
};

export type NodeStatus = "idle" | "running" | "done" | "error";
export type PortSide = "top" | "bottom" | "left" | "right";

// 業務SaaS (n8n / Make / Zapier) のノードを参考にした静かなデザイン
// 実行中は左に細い線が走る + 右上にちっちゃい点滅ドット
// 完了は緑チェックのみ。グロー・シマー・パルスは入れない

export const WorkflowNode: React.FC<{
  x: number;
  y: number;
  width?: number;
  height?: number;
  icon: NodeIcon;
  title: string;
  subtitle?: string;
  appearFrame?: number;
  activeFrame?: number;
  activeDuration?: number;
  executionCount?: number;
  flow?: "horizontal" | "vertical";
}> = ({
  x,
  y,
  width = 240,
  height = 96,
  icon,
  title,
  subtitle,
  appearFrame = 0,
  activeFrame = -1,
  activeDuration = 25,
  executionCount,
  flow = "horizontal",
}) => {
  const frame = useCurrentFrame();
  const cfg = ICON_CONFIG[icon];

  const appearOp = interpolate(frame - appearFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isActive =
    activeFrame >= 0 && frame >= activeFrame && frame < activeFrame + activeDuration;
  const isDone = activeFrame >= 0 && frame >= activeFrame + activeDuration;

  const borderColor = isActive
    ? "#3b82f6"
    : isDone
    ? "rgba(74, 222, 128, 0.4)"
    : "rgba(255,255,255,0.08)";

  const showBadge = executionCount !== undefined && executionCount > 0 && isDone;

  const iconSize = Math.min(64, height - 28);
  const titleSize = height >= 90 ? 19 : 16;
  const subtitleSize = height >= 90 ? 13 : 11;

  // 実行中: ノード下部に左→右に流れる細い線 (進捗バー風)
  const lineProgress = isActive
    ? interpolate(frame - activeFrame, [0, activeDuration], [0, 1], {
        extrapolateRight: "clamp",
      })
    : isDone
    ? 1
    : 0;

  // running時のドット点滅 (1秒で1回くらい)
  const blink = isActive ? Math.sin(frame * 0.35) > 0 : false;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        opacity: appearOp,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: "#161922",
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          padding: 12,
          gap: 12,
          overflow: "hidden",
          boxShadow: "0 1px 0 rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* 進捗ライン (下部、active/done時のみ) */}
        {(isActive || isDone) && (
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              height: 2,
              width: `${lineProgress * 100}%`,
              background: isDone ? "#22c55e" : "#3b82f6",
            }}
          />
        )}

        {/* アイコン */}
        <div
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: 6,
            background: cfg.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: iconSize * 0.5,
            color: "#fff",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {cfg.symbol}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "#e5e7eb",
              fontSize: titleSize,
              fontWeight: 600,
              fontFamily:
                "'Segoe UI', 'Yu Gothic UI', Roboto, system-ui, sans-serif",
              letterSpacing: -0.1,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                color: "#6b7280",
                fontSize: subtitleSize,
                marginTop: 3,
                fontFamily:
                  "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* 右上ステータス */}
        {isActive && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#3b82f6",
              opacity: blink ? 1 : 0.3,
            }}
          />
        )}
        {isDone && !showBadge && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 10,
              color: "#22c55e",
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            ✓
          </div>
        )}

        {showBadge && (
          <div
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 22,
              height: 22,
              borderRadius: 11,
              background: "#22c55e",
              color: "#0a0a0f",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "system-ui",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 6px",
              border: "2px solid #0b0d12",
            }}
          >
            {executionCount}
          </div>
        )}
      </div>

      {/* コネクションポート */}
      {flow === "horizontal" ? (
        <>
          <div
            style={{
              position: "absolute",
              left: -4,
              top: height / 2 - 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#161922",
              border: "1.5px solid rgba(255,255,255,0.2)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -4,
              top: height / 2 - 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#161922",
              border: "1.5px solid rgba(255,255,255,0.2)",
            }}
          />
        </>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              left: width / 2 - 4,
              top: -4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#161922",
              border: "1.5px solid rgba(255,255,255,0.2)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: width / 2 - 4,
              bottom: -4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#161922",
              border: "1.5px solid rgba(255,255,255,0.2)",
            }}
          />
        </>
      )}
    </div>
  );
};

export const getPort = (
  x: number,
  y: number,
  width: number,
  height: number,
  side: PortSide
): { x: number; y: number } => {
  switch (side) {
    case "top":
      return { x: x + width / 2, y: y };
    case "bottom":
      return { x: x + width / 2, y: y + height };
    case "left":
      return { x: x, y: y + height / 2 };
    case "right":
      return { x: x + width, y: y + height / 2 };
  }
};
