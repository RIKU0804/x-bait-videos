import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

// ============================================================
// ContentFactoryBait
// 「テーマ1つ入力 → 30本のショート動画が別構成で一気に生成」
// AIコンテンツ量産ツールのデモ。"1回でこんなに作れるの!?" 系。
// 1920×1080、30fps、20秒 (600 frames)
// ============================================================

const C = {
  bg: "#0c0e14",
  panel: "#13161f",
  panelDeep: "#0f1219",
  border: "#222633",
  text: "#e7e9ee",
  textMuted: "#8a90a2",
  textVeryDim: "#565c6e",
  accent: "#7c5cff",
  green: "#2ecc8f",
  yellow: "#e6b450",
  blue: "#4d9fff",
  pink: "#ff5c8a",
  cyan: "#3dd6d0",
};

// カードのサムネ用グラデ (動画っぽい多様なビジュアル)
const THUMB_GRADIENTS = [
  "linear-gradient(135deg, #2b1055, #7597de)",
  "linear-gradient(135deg, #1f4037, #99f2c8)",
  "linear-gradient(135deg, #614385, #516395)",
  "linear-gradient(135deg, #ff512f, #dd2476)",
  "linear-gradient(135deg, #134e5e, #71b280)",
  "linear-gradient(135deg, #0f2027, #2c5364)",
  "linear-gradient(135deg, #41295a, #2f0743)",
  "linear-gradient(135deg, #c31432, #240b36)",
  "linear-gradient(135deg, #16222a, #3a6073)",
  "linear-gradient(135deg, #5f2c82, #49a09d)",
  "linear-gradient(135deg, #1a2980, #26d0ce)",
  "linear-gradient(135deg, #aa076b, #61045f)",
];

// 30本ぶんのタイトル (量産系・別構成)
const TITLES = [
  "Cursorに全部任せた結果", "寝てる間に¥3万入ってた話", "AI副業の落とし穴3つ",
  "Claude Codeで時短した話", "プロンプト1行の威力", "個人開発1ヶ月の数字",
  "自動化で人生変わった", "note×AIで月10万", "失敗した自動化TOP5",
  "AIエージェント並列実行", "0円から始めるAI副業", "Cursor使い倒し術 #3",
  "バズる投稿の型を解析", "AIで記事を量産する", "副業の時間配分",
  "Claudeに会社作らせた", "n8nで全自動化", "RAGの実装が一瞬で",
  "AI画像を量産する方法", "TikTok自動投稿の作り方", "Threads運用を全自動に",
  "月100万までの全工程", "AIで翻訳を一括処理", "Webスクレイピング自動化",
  "予約投稿を仕組み化", "DMを自動で返す方法", "分析を毎朝自動レポート",
  "サムネを量産するAI", "音声から記事を生成", "全SNS同時投稿の裏側",
];

const CATS = ["#shorts", "#reels", "#tiktok", "#yt", "#x"];

type Card = {
  id: number;
  title: string;
  grad: string;
  durSec: number;
  cat: string;
  startAt: number; // 生成開始フレーム
};

// 30枚を時間差で生成 (12フレーム間隔でラッシュ)
const CARDS: Card[] = TITLES.map((title, i) => ({
  id: i,
  title,
  grad: THUMB_GRADIENTS[i % THUMB_GRADIENTS.length],
  durSec: 9 + ((i * 7) % 50), // 0:09〜0:58
  cat: CATS[i % CATS.length],
  startAt: 40 + i * 12,
}));

// 生成パイプラインの段階
const STAGES = ["queued", "台本", "音声", "字幕", "BGM", "書出", "done"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_DURATION = 9; // 各段階9フレーム

const getStage = (card: Card, frame: number): { stage: Stage; idx: number; progress: number } => {
  if (frame < card.startAt) return { stage: "queued", idx: 0, progress: 0 };
  const elapsed = frame - card.startAt;
  const step = Math.floor(elapsed / STAGE_DURATION);
  if (step >= STAGES.length - 1) return { stage: "done", idx: STAGES.length - 1, progress: 1 };
  const stage = STAGES[Math.min(step, STAGES.length - 1)];
  const within = (elapsed % STAGE_DURATION) / STAGE_DURATION;
  return { stage, idx: step, progress: (step + within) / (STAGES.length - 1) };
};

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

export const ContentFactoryBait: React.FC = () => {
  const frame = useCurrentFrame();

  const doneCount = CARDS.filter((c) => getStage(c, frame).stage === "done").length;
  const inProgress = CARDS.filter((c) => {
    const st = getStage(c, frame).stage;
    return st !== "queued" && st !== "done";
  }).length;
  const startedCount = CARDS.filter((c) => frame >= c.startAt).length;

  // 経過秒 (生成タイマー)
  const elapsedSec = (frame / 30).toFixed(1);
  const tokensUsed = 12480 + Math.floor(frame * 84);
  const cost = (0.12 + frame * 0.0021).toFixed(2);

  // 入力欄のタイピング (frame 0-30)
  const theme = "副業 × AI 自動化";
  const typedTheme =
    frame < 6 ? "" : frame >= 30 ? theme : theme.slice(0, Math.floor(((frame - 6) / 24) * theme.length));

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: "'Segoe UI', 'Yu Gothic UI', 'Meiryo UI', system-ui, sans-serif" }}>
      {/* ====== トップバー ====== */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: C.panelDeep,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            ⚡
          </div>
          <span style={{ color: C.text, fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>
            reelforge
          </span>
          <span style={{ color: C.textVeryDim, fontSize: 12 }}>batch generator</span>
        </div>

        {/* テーマ入力欄 */}
        <div
          style={{
            flex: 1,
            maxWidth: 560,
            height: 32,
            background: C.panel,
            border: `1px solid ${frame < 36 ? C.accent : C.border}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            gap: 10,
            color: C.text,
            fontSize: 13,
          }}
        >
          <span style={{ color: C.textVeryDim }}>theme</span>
          <span style={{ color: C.textVeryDim }}>›</span>
          <span>
            {typedTheme}
            {frame < 30 && frame >= 6 && (
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 14,
                  marginLeft: 1,
                  background: C.accent,
                  verticalAlign: "middle",
                  opacity: Math.sin(frame * 0.7) > 0 ? 1 : 0,
                }}
              />
            )}
          </span>
          <span style={{ marginLeft: "auto", color: C.textVeryDim, fontSize: 11 }}>30 本</span>
        </div>

        <div
          style={{
            padding: "7px 16px",
            borderRadius: 8,
            background: frame < 36 ? C.textVeryDim : `linear-gradient(135deg, ${C.accent}, #6b46ff)`,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {frame < 36 ? (
            "生成"
          ) : doneCount >= CARDS.length ? (
            "✓ 完了"
          ) : (
            <>
              <div
                style={{
                  width: 10,
                  height: 10,
                  border: "2px solid #ffffff55",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  transform: `rotate(${frame * 24}deg)`,
                }}
              />
              生成中
            </>
          )}
        </div>
      </div>

      {/* ====== ステータス帯 ====== */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 0,
          right: 0,
          height: 44,
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 34,
        }}
      >
        {[
          { label: "生成済み", value: `${doneCount} / ${CARDS.length}`, color: C.green },
          { label: "並列生成中", value: `${inProgress}`, color: C.yellow },
          { label: "経過", value: `${elapsedSec}s`, color: C.text },
          { label: "トークン", value: tokensUsed.toLocaleString(), color: C.text },
          { label: "コスト", value: `$${cost}`, color: C.text },
          { label: "1本あたり平均", value: "8.4s", color: C.text },
          { label: "全部別構成", value: "✓ unique", color: C.cyan },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ color: C.textVeryDim, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.4 }}>
              {s.label}
            </span>
            <span style={{ color: s.color, fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {s.value}
            </span>
          </div>
        ))}

        {/* 全体進捗バー */}
        <div style={{ flex: 1, marginLeft: "auto", maxWidth: 280 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textVeryDim, marginBottom: 3 }}>
            <span>overall</span>
            <span>{Math.round((doneCount / CARDS.length) * 100)}%</span>
          </div>
          <div style={{ height: 5, background: C.panel, borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(doneCount / CARDS.length) * 100}%`,
                background: `linear-gradient(90deg, ${C.accent}, ${C.pink})`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ====== カードグリッド (縦型ショート動画サムネ) ====== */}
      <div
        style={{
          position: "absolute",
          top: 112,
          left: 24,
          right: 24,
          bottom: 20,
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {CARDS.map((card) => {
          const { stage, idx, progress } = getStage(card, frame);
          const isDone = stage === "done";
          const isQueued = stage === "queued";
          const isWorking = !isDone && !isQueued;

          // 出現アニメ (startAt で fade-in)
          const appear = interpolate(frame - card.startAt + 8, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={card.id}
              style={{
                position: "relative",
                borderRadius: 8,
                overflow: "hidden",
                border: `1px solid ${isWorking ? C.accent + "aa" : C.border}`,
                background: C.panel,
                opacity: isQueued ? 0.3 : appear,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* サムネ部分 (縦型動画イメージ) */}
              <div
                style={{
                  flex: 1,
                  background: isQueued ? C.panelDeep : card.grad,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 0,
                }}
              >
                {isDone ? (
                  <>
                    {/* ビネット (焼き文字を読みやすく) */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.55) 100%)",
                      }}
                    />
                    {/* 煽りタイトル (サムネに焼いた大文字 — 量産ショートのキモ) */}
                    <div
                      style={{
                        position: "absolute",
                        inset: "8px 9px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          color: "#fff",
                          fontSize: 15,
                          fontWeight: 900,
                          lineHeight: 1.18,
                          textAlign: "center",
                          letterSpacing: -0.3,
                          textShadow:
                            "0 2px 7px rgba(0,0,0,0.92), 0 0 2px rgba(0,0,0,1), 0 0 1px rgba(0,0,0,1)",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {card.title}
                      </span>
                    </div>
                    {/* 再生ボタン (控えめ) */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 6,
                        left: 6,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 8,
                      }}
                    >
                      ▶
                    </div>
                    {/* 再生時間 */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        background: "rgba(0,0,0,0.65)",
                        color: "#fff",
                        fontSize: 9,
                        padding: "1px 5px",
                        borderRadius: 3,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {fmtTime(card.durSec)}
                    </div>
                    {/* カテゴリ */}
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        background: "rgba(0,0,0,0.5)",
                        color: "#fff",
                        fontSize: 8,
                        padding: "1px 5px",
                        borderRadius: 3,
                      }}
                    >
                      {card.cat}
                    </div>
                  </>
                ) : isWorking ? (
                  <div style={{ textAlign: "center", color: "#fff", width: "100%", padding: "0 8px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{stage}</div>
                    {/* ステージドット */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 6 }}>
                      {STAGES.slice(1, 6).map((s, si) => (
                        <div
                          key={s}
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: si < idx ? C.green : si === idx ? "#fff" : "rgba(255,255,255,0.25)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <span style={{ color: C.textVeryDim, fontSize: 9 }}>queued</span>
                )}

                {/* 生成中の進捗バー (下端) */}
                {isWorking && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      height: 3,
                      width: `${progress * 100}%`,
                      background: C.green,
                    }}
                  />
                )}
              </div>

              {/* タイトル帯 */}
              <div
                style={{
                  padding: "5px 7px",
                  background: C.panel,
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    color: isQueued ? C.textVeryDim : C.text,
                    fontSize: 9.5,
                    fontWeight: 600,
                    lineHeight: 1.25,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    color: C.textVeryDim,
                    fontSize: 8,
                    marginTop: 2,
                    fontFamily: "'JetBrains Mono', monospace",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>#{(card.id + 1).toString().padStart(2, "0")}</span>
                  <span>{isDone ? "✓ 1080×1920" : isWorking ? `${Math.round(progress * 100)}%` : "—"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ====== 完了時の控えめなサマリ ====== */}
      {doneCount >= CARDS.length && (
        <div
          style={{
            position: "absolute",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(46, 204, 143, 0.12)",
            border: `1px solid ${C.green}66`,
            borderRadius: 8,
            padding: "8px 18px",
            color: C.green,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            display: "flex",
            gap: 14,
          }}
        >
          <span>● 30 本完成 · {elapsedSec}s · 全部別構成 · $0.{cost.split(".")[1]}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};
