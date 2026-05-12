import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

// 成功通知トースト — 右上から滑り込む
export const NotificationToast: React.FC<{
  appearFrame: number;
  duration?: number;
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  stackIndex?: number; // 複数トースト時の縦位置
}> = ({ appearFrame, duration = 90, title, subtitle, icon, iconBg, stackIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = frame - appearFrame;

  if (elapsed < 0 || elapsed > duration) return null;

  // スプリングで入ってくる
  const enterProgress = spring({
    frame: elapsed,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.6 },
  });

  // フェードアウト
  const exitProgress = elapsed > duration - 20 ? (duration - elapsed) / 20 : 1;

  const x = interpolate(enterProgress, [0, 1], [380, 0]);
  const opacity = enterProgress * exitProgress;

  return (
    <div
      style={{
        position: "absolute",
        top: 110 + stackIndex * 88,
        right: 24,
        width: 360,
        opacity,
        transform: `translateX(${x}px)`,
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "rgba(20, 20, 28, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(74, 222, 128, 0.25)",
          borderRadius: 12,
          padding: 14,
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow:
            "0 10px 40px rgba(0, 0, 0, 0.4), 0 0 24px rgba(74, 222, 128, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* アイコン */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 22,
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
          }}
        >
          {icon}
        </div>

        {/* テキスト */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "system-ui",
              lineHeight: 1.2,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ color: "#4ade80" }}>✓</span>
            {title}
          </div>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 11,
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
        </div>

        {/* タイムスタンプ */}
        <div
          style={{
            color: "#475569",
            fontSize: 10,
            fontFamily: "monospace",
            flexShrink: 0,
            alignSelf: "flex-start",
            marginTop: 4,
          }}
        >
          now
        </div>
      </div>
    </div>
  );
};
