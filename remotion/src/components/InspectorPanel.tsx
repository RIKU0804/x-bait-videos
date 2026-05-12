import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

// Claude が生成中のテキストをリアルタイムで見せる右側パネル
const STREAM_TEXT = `# Generated viral post

AI開発で「コード書く時間」を
捨てた結果がこれです。

寝てる間にSaaSが3つ
完成してました。本当に。

→ Threads ✓
→ X ✓
→ note (draft)
→ Instagram (queued)

#AI開発 #Claude #自動化`;

export const InspectorPanel: React.FC<{
  appearFrame: number;
  streamStartFrame: number;
  streamEndFrame: number;
}> = ({ appearFrame, streamStartFrame, streamEndFrame }) => {
  const frame = useCurrentFrame();

  const appearOp = interpolate(frame - appearFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const appearX = interpolate(frame - appearFrame, [0, 20], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ストリーミング文字数
  const streamProgress = interpolate(
    frame,
    [streamStartFrame, streamEndFrame],
    [0, STREAM_TEXT.length],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const visibleText = STREAM_TEXT.slice(0, Math.floor(streamProgress));
  const isStreaming = frame >= streamStartFrame && frame < streamEndFrame;

  // トークン数カウント
  const tokenCount = Math.floor(streamProgress * 0.6 + 12);
  const elapsedMs = Math.max(0, Math.floor((frame - streamStartFrame) * 33.3));

  return (
    <div
      style={{
        position: "absolute",
        top: 110,
        right: 24,
        width: 320,
        opacity: appearOp,
        transform: `translateX(${appearX}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(15, 15, 22, 0.92)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(204, 120, 92, 0.25)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow:
            "0 10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(204, 120, 92, 0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#cc785c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
              }}
            >
              ✦
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>
                Claude Opus 4.7
              </div>
              <div
                style={{
                  color: "#64748b",
                  fontSize: 10,
                  fontFamily: "monospace",
                  marginTop: 1,
                }}
              >
                anthropic / sonnet
              </div>
            </div>
          </div>

          {isStreaming && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 8px",
                background: "rgba(204, 120, 92, 0.12)",
                border: "1px solid rgba(204, 120, 92, 0.3)",
                borderRadius: 100,
                fontSize: 9,
                color: "#cc785c",
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: 1.5,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#cc785c",
                  opacity: Math.sin(frame * 0.4) * 0.4 + 0.6,
                }}
              />
              STREAM
            </div>
          )}
        </div>

        {/* タブ */}
        <div
          style={{
            display: "flex",
            padding: "0 16px",
            gap: 0,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {["Output", "Input", "Metadata"].map((t, i) => (
            <div
              key={t}
              style={{
                padding: "10px 12px",
                fontSize: 11,
                fontFamily: "monospace",
                color: i === 0 ? "#fff" : "#64748b",
                borderBottom: i === 0 ? "2px solid #cc785c" : "2px solid transparent",
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* ストリーミングコンテンツ */}
        <div
          style={{
            padding: 14,
            minHeight: 240,
            maxHeight: 320,
            overflow: "hidden",
          }}
        >
          <pre
            style={{
              margin: 0,
              color: "#e2e8f0",
              fontSize: 11.5,
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {visibleText}
            {isStreaming && (
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 14,
                  background: "#cc785c",
                  verticalAlign: "text-bottom",
                  marginLeft: 1,
                  opacity: Math.sin(frame * 0.4) > 0 ? 1 : 0,
                }}
              />
            )}
          </pre>
        </div>

        {/* フッター */}
        <div
          style={{
            padding: "10px 14px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            color: "#64748b",
            fontSize: 10,
            fontFamily: "monospace",
          }}
        >
          <span>
            <span style={{ color: "#cc785c" }}>{tokenCount}</span> tokens
          </span>
          <span>{elapsedMs}ms</span>
          <span>$0.0{Math.min(9, Math.floor(tokenCount / 30))}</span>
        </div>
      </div>
    </div>
  );
};
