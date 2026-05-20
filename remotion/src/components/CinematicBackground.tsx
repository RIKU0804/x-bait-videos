import React from "react";

// 本物のSaaS管理画面っぽいフラットな背景
// n8n / Linear / Vercel Dashboard を参考にした「動いていない」静かな背景
// 派手なエフェクトはあえて入れない (素人ほど "本物っぽさ" に騙される)

export const CinematicBackground: React.FC = () => {
  return (
    <>
      {/* ベース: 単色ダーク */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#0b0d12",
        }}
      />

      {/* ドットグリッド (静止) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* 左上の微弱な光 (ほぼ気づかない程度) */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          left: -200,
          top: -300,
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 60%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* 右下の微弱な光 */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          right: -200,
          bottom: -300,
          background:
            "radial-gradient(circle, rgba(255, 109, 90, 0.05) 0%, transparent 60%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* ビネット (画面端をわずかに暗く) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
};
