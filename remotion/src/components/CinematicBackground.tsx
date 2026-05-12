import React from "react";
import { useCurrentFrame } from "remotion";

// Vercel/Linear系のシネマティック背景
// グラデーションメッシュ + ドットグリッド + パーティクル + スキャンライン

const PARTICLES = Array.from({ length: 60 }, (_, i) => ({
  x: Math.random() * 1920,
  y: Math.random() * 1080,
  size: 0.5 + Math.random() * 2,
  speed: 0.1 + Math.random() * 0.4,
  offset: Math.random() * 1000,
  hue: Math.random() > 0.7 ? 15 : 220, // たまにオレンジ、基本ブルー
}));

export const CinematicBackground: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <>
      {/* ベース */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 20%, #1a1530 0%, transparent 50%), " +
            "radial-gradient(ellipse at 70% 80%, #0f1a30 0%, transparent 50%), " +
            "#06060c",
        }}
      />

      {/* グラデーションメッシュ — 動く */}
      <div
        style={{
          position: "absolute",
          width: 1200,
          height: 1200,
          left: 200 + Math.sin(frame * 0.005) * 100,
          top: -200 + Math.cos(frame * 0.005) * 100,
          background:
            "radial-gradient(circle, rgba(255, 109, 90, 0.12) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          right: -100 + Math.sin(frame * 0.004) * 80,
          bottom: -200 + Math.cos(frame * 0.006) * 80,
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.10) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          left: 700 + Math.sin(frame * 0.008) * 120,
          top: 300 + Math.cos(frame * 0.008) * 100,
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />

      {/* ドットグリッド */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          backgroundPosition: `${(frame * 0.3) % 32}px ${(frame * 0.15) % 32}px`,
        }}
      />

      {/* スキャンライン (微妙) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.012) 3px, transparent 4px)",
          pointerEvents: "none",
        }}
      />

      {/* パーティクル */}
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {PARTICLES.map((p, i) => {
          const drift = (frame * p.speed) % 1080;
          const y = (p.y - drift + 1080) % 1080;
          const twinkle = Math.sin((frame + p.offset) * 0.08) * 0.4 + 0.6;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={y}
              r={p.size}
              fill={p.hue === 15 ? "#ff8a72" : "#7a9eff"}
              opacity={twinkle * 0.5}
            />
          );
        })}
      </svg>

      {/* ビネット */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
};
