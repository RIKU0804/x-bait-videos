import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

// 左サイドバー — n8nの実エディタにあるノード一覧
const CATEGORIES = [
  { name: "Triggers",   count: 12, icon: "⏱", color: "#ff6d5a", active: false },
  { name: "Apps",       count: 142, icon: "◇", color: "#60a5fa", active: false },
  { name: "AI",         count: 8,  icon: "✦", color: "#cc785c", active: true  },
  { name: "Flow",       count: 24, icon: "⌥", color: "#a78bfa", active: false },
  { name: "Code",       count: 6,  icon: "{}", color: "#fbbf24", active: false },
  { name: "Data",       count: 18, icon: "≈", color: "#3ecf8e", active: false },
];

export const SidebarPanel: React.FC<{ appearFrame: number }> = ({ appearFrame }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - appearFrame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(frame - appearFrame, [0, 18], [-40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 110,
        left: 24,
        width: 220,
        opacity,
        transform: `translateX(${x}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(15, 15, 22, 0.92)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow:
            "0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* 検索 */}
        <div
          style={{
            padding: 12,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span style={{ color: "#64748b", fontSize: 12 }}>⌕</span>
            <span style={{ color: "#475569", fontSize: 11, fontFamily: "monospace" }}>
              Search nodes...
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                color: "#475569",
                fontSize: 9,
                fontFamily: "monospace",
                padding: "1px 5px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 3,
              }}
            >
              ⌘K
            </span>
          </div>
        </div>

        {/* カテゴリ */}
        <div style={{ padding: 8 }}>
          <div
            style={{
              color: "#475569",
              fontSize: 9,
              fontFamily: "monospace",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              padding: "8px 8px 6px",
            }}
          >
            Categories
          </div>
          {CATEGORIES.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 8px",
                borderRadius: 6,
                background: c.active ? "rgba(204, 120, 92, 0.08)" : "transparent",
                marginBottom: 1,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background: c.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#fff",
                  fontWeight: 700,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
                }}
              >
                {c.icon}
              </div>
              <span
                style={{
                  flex: 1,
                  color: c.active ? "#fff" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: c.active ? 600 : 500,
                }}
              >
                {c.name}
              </span>
              <span
                style={{
                  color: "#475569",
                  fontSize: 10,
                  fontFamily: "monospace",
                  padding: "1px 6px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 10,
                }}
              >
                {c.count}
              </span>
            </div>
          ))}
        </div>

        {/* 下部: ミニ統計 */}
        <div
          style={{
            padding: 12,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.015)",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: 9,
              fontFamily: "monospace",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            This workflow
          </div>
          {[
            { l: "Nodes", v: "9" },
            { l: "Triggers", v: "1" },
            { l: "Schedule", v: "30m" },
            { l: "Last run", v: "2s ago" },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                fontSize: 11,
                color: "#94a3b8",
                fontFamily: "monospace",
              }}
            >
              <span>{s.l}</span>
              <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
