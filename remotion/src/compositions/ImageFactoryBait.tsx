import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

// ============================================================
// ImageFactoryBait
// 1キャラ(seed固定で顔が一貫) の投稿用画像を日次大量生成。
// シチュ/服装違いが30枚バーッと出来上がるギャラリー。
// ※実在人物画像は扱わない。生成UIの演出。NSFW filter: on / 健全シチュのみ
// 1920×1080、30fps、18秒 (540 frames)
// ============================================================

const C = {
  bg: "#0c0a12",
  panel: "#15121d",
  panelDeep: "#100e17",
  border: "#2a2436",
  text: "#efe9f5",
  textMuted: "#9a8fae",
  textVeryDim: "#5e5570",
  pink: "#ec4899",
  purple: "#a855f7",
  green: "#2ecc8f",
  yellow: "#e6b450",
  cyan: "#3dd6d0",
};

// ポートレート写真トーン (背景 / 髪 / 肌 / 服) — 顔は描かずソフトフォーカスの色面で写真感
type Tone = { bg: string; bg2: string; hair: string; skin: string; outfit: string };
const TONES: Tone[] = [
  { bg: "#cbb89e", bg2: "#8a7355", hair: "#2c2018", skin: "#f1c9a4", outfit: "#e3a3b4" }, // カフェ暖色
  { bg: "#aac3d6", bg2: "#6f8ca3", hair: "#1f1a16", skin: "#eec5a0", outfit: "#7fa3cc" }, // 屋外青み
  { bg: "#d8cdbe", bg2: "#a89478", hair: "#3a2a20", skin: "#f3cda8", outfit: "#cdbf9a" }, // ナチュラル
  { bg: "#c9b4c8", bg2: "#8a6f87", hair: "#241a18", skin: "#efc4a2", outfit: "#b58fc4" }, // 夕方
  { bg: "#bcd0c4", bg2: "#7c9a86", hair: "#2a221c", skin: "#f0c7a4", outfit: "#8fbfa6" }, // 公園グリーン
  { bg: "#e3cdbe", bg2: "#b48f74", hair: "#322218", skin: "#f4cfa9", outfit: "#e0a7a0" }, // 朝の窓際
  { bg: "#b8bdcc", bg2: "#787e92", hair: "#1d1916", skin: "#eec3a0", outfit: "#9aa0c4" }, // 室内クール
  { bg: "#d6c2b0", bg2: "#a07f63", hair: "#2e211a", skin: "#f2caa6", outfit: "#caa98e" }, // ベージュ
];

// 健全なシチュエーションのみ
const SCENES = [
  "カフェ", "オフィス", "自宅リビング", "旅行先", "部屋着", "オフィスカジュアル",
  "公園", "ジム", "読書中", "料理中", "ベランダ", "通勤", "デスク作業", "海辺",
  "桜の前で", "雨の日の窓際", "ヨガ", "カフェで作業", "散歩", "ショッピング",
  "朝の支度", "夜景バック", "図書館", "テラス席", "観葉植物と", "ペットと",
  "自撮り風", "横顔", "公園のベンチ", "本屋さん",
];

const SEED = 8847291;

type Card = { id: number; scene: string; tone: Tone; startAt: number };
const CARDS: Card[] = SCENES.map((scene, i) => ({
  id: i,
  scene,
  tone: TONES[i % TONES.length],
  startAt: 36 + i * 13,
}));

const STAGES = ["pose", "outfit", "scene", "render", "upscale", "done"];
const STAGE_DUR = 7;

const cState = (c: Card, frame: number) => {
  if (frame < c.startAt) return { stage: -1, done: false, progress: 0 };
  const step = Math.floor((frame - c.startAt) / STAGE_DUR);
  if (step >= STAGES.length - 1) return { stage: STAGES.length - 1, done: true, progress: 1 };
  return { stage: step, done: false, progress: Math.min(1, (frame - c.startAt) / ((STAGES.length - 1) * STAGE_DUR)) };
};

// ポートレート写真っぽい抽象プレート (顔は描かない・ソフトフォーカスの色面)
// clarity: 0 = 生成中(ノイズ+強ブラー) → 1 = 完成(クリア)
const PhotoPlate: React.FC<{ tone: Tone; clarity: number; nid: number }> = ({ tone, clarity, nid }) => {
  const blurPx = (1 - clarity) * 13 + 1.4;
  const noiseOp = (1 - clarity) * 0.5 + 0.07;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* 背景 (自然光の縦グラデ) */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${tone.bg} 0%, ${tone.bg2} 100%)` }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 72% 22%, rgba(255,255,255,0.34), transparent 55%)` }} />
      {/* 人物ボリューム (顔は描かずぼかした色塊) */}
      <div style={{ position: "absolute", inset: 0, filter: `blur(${blurPx}px)` }}>
        {/* 服 (下) */}
        <div style={{ position: "absolute", bottom: 0, left: "15%", width: "70%", height: "48%", background: `radial-gradient(ellipse at 50% 30%, ${tone.outfit}, transparent 75%)`, borderRadius: "50% 50% 0 0" }} />
        {/* 髪/頭 (上中央) */}
        <div style={{ position: "absolute", top: "12%", left: "33%", width: "34%", height: "44%", background: `radial-gradient(ellipse, ${tone.hair}, transparent 72%)`, borderRadius: "50%" }} />
        {/* 肌 (顔・首のあたり、描写なしの明るい色面) */}
        <div style={{ position: "absolute", top: "19%", left: "39%", width: "22%", height: "32%", background: `radial-gradient(ellipse, ${tone.skin}, transparent 70%)`, borderRadius: "50%" }} />
      </div>
      {/* フィルムグレイン */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: noiseOp, mixBlendMode: "overlay", pointerEvents: "none" }}>
        <filter id={`grain${nid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={nid} />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain${nid})`} />
      </svg>
      {/* ビネット */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.42) 100%)" }} />
    </div>
  );
};

export const ImageFactoryBait: React.FC = () => {
  const frame = useCurrentFrame();
  const done = CARDS.filter((c) => cState(c, frame).done).length;
  const sec = (frame / 30).toFixed(1);

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: "'Segoe UI', 'Yu Gothic UI', 'Meiryo UI', system-ui, sans-serif" }}>
      {/* トップバー */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, background: C.panelDeep, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 22px", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 25, height: 25, borderRadius: 7, background: `linear-gradient(135deg,${C.pink},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>▦</div>
          <span style={{ color: C.text, fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>imageforge</span>
          <span style={{ color: C.textVeryDim, fontSize: 11 }}>seed-locked batch render</span>
        </div>
        {/* キャラ選択 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 30, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 12px", fontSize: 12, color: C.text }}>
          <span style={{ width: 16, height: 16, borderRadius: "50%", background: `linear-gradient(135deg,${C.pink},${C.purple})` }} />
          <span style={{ fontWeight: 600 }}>美緒</span>
          <span style={{ color: C.textVeryDim, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>@mio_studio</span>
          <span style={{ color: C.textVeryDim }}>·</span>
          <span style={{ color: C.cyan, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>seed {SEED}</span>
          <span style={{ marginLeft: 4 }}>▾</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(46,204,143,0.1)", border: `1px solid ${C.green}44`, borderRadius: 5, color: C.green, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />NSFW filter: on
          </div>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: frame < 36 ? C.textVeryDim : `linear-gradient(135deg,${C.pink},${C.purple})`, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
            {done >= CARDS.length ? "✓ 完了" : <><div style={{ width: 9, height: 9, border: "2px solid #ffffff55", borderTopColor: "#fff", borderRadius: "50%", transform: `rotate(${frame * 24}deg)` }} />30枚 生成中</>}
          </div>
        </div>
      </div>

      {/* 統計帯 */}
      <div style={{ position: "absolute", top: 54, left: 0, right: 0, height: 42, background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 22px", gap: 30 }}>
        {[
          { l: "生成済み", v: `${done} / 30`, c: C.green },
          { l: "経過", v: `${sec}s`, c: C.text },
          { l: "顔の一貫性", v: `${(99.1 - Math.sin(frame * 0.05) * 0.3).toFixed(1)}%`, c: C.cyan },
          { l: "seed", v: `${SEED} (locked)`, c: C.purple },
          { l: "シチュ種別", v: `${Math.min(done, 30)} / 30`, c: C.yellow },
          { l: "1枚あたり", v: "1.4s", c: C.text },
          { l: "出力", v: "1080×1350 PNG", c: C.textMuted },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ color: C.textVeryDim, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>{s.l}</span>
            <span style={{ color: s.c, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.v}</span>
          </div>
        ))}
      </div>

      {/* 画像グリッド 6×5 */}
      <div style={{ position: "absolute", top: 106, left: 18, right: 18, bottom: 16, display: "grid", gridTemplateColumns: "repeat(6,1fr)", gridTemplateRows: "repeat(5,1fr)", gap: 10 }}>
        {CARDS.map((c, i) => {
          const st = cState(c, frame);
          const queued = st.stage === -1;
          const working = !queued && !st.done;
          const appear = interpolate(frame - c.startAt + 6, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={c.id} style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${working ? C.pink + "aa" : C.border}`, background: C.panel, opacity: queued ? 0.28 : appear, display: "flex", flexDirection: "column", position: "relative" }}>
              {/* ポートレート写真 (実画像なし・ボケた色面で写真感 + diffusion風) */}
              <div style={{ flex: 1, background: C.panelDeep, position: "relative", overflow: "hidden", minHeight: 0 }}>
                {queued ? (
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.textVeryDim, fontSize: 9 }}>queued</span>
                ) : (
                  <>
                    {/* 生成中は clarity=progress(ノイズから晴れる)、完成で clarity=1 */}
                    <PhotoPlate tone={c.tone} clarity={st.done ? 1 : Math.max(0.05, st.progress)} nid={c.id} />
                    {!working && (
                      <>
                        <div style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.42)", color: "#fff", fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "'JetBrains Mono', monospace" }}>AI gen</div>
                        <div style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,0.42)", color: "#fff", fontSize: 7, padding: "1px 4px", borderRadius: 3 }}>{c.scene}</div>
                        <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "'JetBrains Mono', monospace" }}>1080×1350</div>
                      </>
                    )}
                    {working && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <div style={{ width: 18, height: 18, border: "2px solid #ffffff66", borderTopColor: "#fff", borderRadius: "50%", transform: `rotate(${frame * 22}deg)` }} />
                        <span style={{ color: "#fff", fontSize: 9, fontWeight: 600, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>{STAGES[Math.min(st.stage, STAGES.length - 1)]} · {Math.round(st.progress * 100)}%</span>
                      </div>
                    )}
                    {working && <div style={{ position: "absolute", bottom: 0, left: 0, height: 3, width: `${st.progress * 100}%`, background: C.green }} />}
                  </>
                )}
              </div>
              {/* キャプション */}
              <div style={{ padding: "4px 7px", background: C.panel, borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8.5, color: C.textVeryDim, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span>#{(c.id + 1).toString().padStart(2, "0")} · seed {SEED}</span>
                  <span style={{ color: st.done ? C.green : working ? C.yellow : C.textVeryDim }}>{st.done ? "✓" : working ? `${Math.round(st.progress * 100)}%` : "—"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {done >= CARDS.length && (
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "rgba(236,72,153,0.14)", border: `1px solid ${C.pink}66`, borderRadius: 8, padding: "8px 18px", color: C.pink, fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
          ● 美緒 の投稿画像 30枚を {sec}s で生成 · 顔一貫 99.1% · 同一人物保証
        </div>
      )}
    </AbsoluteFill>
  );
};
