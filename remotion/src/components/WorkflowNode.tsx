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

const ICON_CONFIG: Record<NodeIcon, { bg: string; symbol: string }> = {
  schedule:  { bg: "#ff6d5a", symbol: "⏱" },
  http:      { bg: "#3b82f6", symbol: "↯" },
  claude:    { bg: "#cc785c", symbol: "✦" },
  openai:    { bg: "#10a37f", symbol: "✺" },
  gemini:    { bg: "linear-gradient(135deg, #4285f4, #9b72cb, #d96570)", symbol: "✧" },
  vector:    { bg: "#7c3aed", symbol: "⊞" },
  x:         { bg: "#000", symbol: "𝕏" },
  threads:   { bg: "#000", symbol: "@" },
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

  const appearOp = interpolate(frame - appearFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const appearScale = interpolate(frame - appearFrame, [0, 12], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isActive =
    activeFrame >= 0 && frame >= activeFrame && frame < activeFrame + activeDuration;
  const isDone = activeFrame >= 0 && frame >= activeFrame + activeDuration;

  const glowIntensity = isActive
    ? interpolate(frame - activeFrame, [0, 6, activeDuration], [0, 1, 0.4], {
        extrapolateRight: "clamp",
      })
    : isDone
    ? 0.15
    : 0;

  const borderColor = isActive
    ? "#ff6d5a"
    : isDone
    ? "rgba(74, 222, 128, 0.4)"
    : "rgba(255,255,255,0.08)";

  const showBadge = executionCount !== undefined && executionCount > 0 && isDone;

  const iconSize = Math.min(64, height - 28);
  const titleSize = height >= 90 ? 19 : 16;
  const subtitleSize = height >= 90 ? 13 : 11;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        opacity: appearOp,
        transform: `scale(${appearScale})`,
        transformOrigin: "center",
      }}
    >
      {glowIntensity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: -16,
            background: `radial-gradient(ellipse at center, ${
              isActive
                ? "rgba(255, 109, 90, " + glowIntensity * 0.5 + ")"
                : "rgba(74, 222, 128, 0.1)"
            } 0%, transparent 60%)`,
            filter: "blur(8px)",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: "rgba(20, 20, 28, 0.94)",
          backdropFilter: "blur(16px)",
          border: `1.5px solid ${borderColor}`,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          padding: 12,
          gap: 12,
          boxShadow: isActive
            ? `0 0 28px rgba(255, 109, 90, ${glowIntensity * 0.6}), inset 0 1px 0 rgba(255,255,255,0.06)`
            : "0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: 10,
            background: cfg.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: iconSize * 0.5,
            color: "#fff",
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
          }}
        >
          {cfg.symbol}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "#fff",
              fontSize: titleSize,
              fontWeight: 700,
              fontFamily: "system-ui",
              letterSpacing: -0.2,
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
                color: "#94a3b8",
                fontSize: subtitleSize,
                marginTop: 3,
                fontFamily: "'JetBrains Mono', monospace",
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

        {/* ステータス: 絶対配置でテキスト領域を圧迫しない */}
        {isActive && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#ff6d5a",
              boxShadow: "0 0 8px #ff6d5a",
            }}
          />
        )}
        {isDone && !showBadge && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 8,
              color: "#4ade80",
              fontSize: 18,
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
              top: -8,
              right: -8,
              minWidth: 28,
              height: 28,
              borderRadius: 14,
              background: "#4ade80",
              color: "#0a0a0f",
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "system-ui",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 8px",
              border: "2px solid #0a0a0f",
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
              left: -5,
              top: height / 2 - 5,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#1a1a24",
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -5,
              top: height / 2 - 5,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#1a1a24",
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          />
        </>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              left: width / 2 - 5,
              top: -5,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#1a1a24",
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: width / 2 - 5,
              bottom: -5,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#1a1a24",
              border: "2px solid rgba(255,255,255,0.2)",
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
