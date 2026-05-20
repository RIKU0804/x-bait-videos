import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

// ============================================================
// DMCloserBait
// AI美女垢の受信DMをAIが自動会話 → ファンクラブへ誘導するダッシュボード。
// 複数スレッドが並列で進行、課金転換がリアルタイムで積み上がる。
// ※会話は健全なファン対応＋ファンクラブ案内のみ。NSFW filter: on
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
  blue: "#6b8afd",
  inbound: "#1d2030",
};

type Stage = "new" | "talking" | "guiding" | "closed" | "left";

type Thread = {
  fan: string;          // 男性フォロワー
  persona: string;      // 担当AI美女
  personaColor: string;
  startAt: number;
  // ステージ遷移フレーム
  talkAt: number;
  guideAt: number;
  endAt: number;
  outcome: "closed" | "left";
  price: number;        // クローズ時の課金額
  lastMsg: string;      // 直近メッセージ(健全)
};

const THREADS: Thread[] = [
  { fan: "@takashi_pp",   persona: "美緒",   personaColor: "#ec4899", startAt: 8,   talkAt: 24,  guideAt: 70,  endAt: 96,  outcome: "closed", price: 980,  lastMsg: "入りました!応援してます" },
  { fan: "@ken_2580",     persona: "結衣",   personaColor: "#a855f7", startAt: 14,  talkAt: 32,  guideAt: 84,  endAt: 118, outcome: "closed", price: 780,  lastMsg: "限定の方も登録しました☺️" },
  { fan: "@yuuki_dev",    persona: "莉子",   personaColor: "#3dd6d0", startAt: 22,  talkAt: 44,  guideAt: 96,  endAt: 130, outcome: "left",   price: 0,    lastMsg: "また今度検討します" },
  { fan: "@masa_0401",    persona: "さくら", personaColor: "#e6b450", startAt: 30,  talkAt: 52,  guideAt: 104, endAt: 148, outcome: "closed", price: 1280, lastMsg: "登録完了です!楽しみ" },
  { fan: "@ryo_camera",   persona: "七海",   personaColor: "#6b8afd", startAt: 40,  talkAt: 64,  guideAt: 128, endAt: 168, outcome: "closed", price: 980,  lastMsg: "ファンクラブ入りました" },
  { fan: "@daichi_x",     persona: "葵",     personaColor: "#2ecc8f", startAt: 52,  talkAt: 76,  guideAt: 140, endAt: 174, outcome: "closed", price: 480,  lastMsg: "毎日見ます!入会しました" },
  { fan: "@hiro_run",     persona: "楓",     personaColor: "#ec4899", startAt: 66,  talkAt: 92,  guideAt: 160, endAt: 210, outcome: "closed", price: 1480, lastMsg: "プレミアム登録しました" },
  { fan: "@sho_engineer", persona: "美咲",   personaColor: "#a855f7", startAt: 80,  talkAt: 108, guideAt: 176, endAt: 214, outcome: "closed", price: 880,  lastMsg: "応援の意味で入りました" },
  { fan: "@nao_222",      persona: "ひなた", personaColor: "#3dd6d0", startAt: 96,  talkAt: 124, guideAt: 196, endAt: 236, outcome: "left",   price: 0,    lastMsg: "ちょっと考えますね" },
  { fan: "@taku_fit",     persona: "真央",   personaColor: "#e6b450", startAt: 112, talkAt: 140, guideAt: 212, endAt: 258, outcome: "closed", price: 1080, lastMsg: "入会しました!応援!" },
  { fan: "@gen_photo",    persona: "杏奈",   personaColor: "#6b8afd", startAt: 130, talkAt: 158, guideAt: 232, endAt: 276, outcome: "closed", price: 780,  lastMsg: "ファンクラブ登録です" },
  { fan: "@yuto_side",    persona: "玲奈",   personaColor: "#2ecc8f", startAt: 150, talkAt: 178, guideAt: 252, endAt: 300, outcome: "closed", price: 880,  lastMsg: "登録しました、楽しみ" },
  { fan: "@k_toushi",     persona: "美羽",   personaColor: "#ec4899", startAt: 172, talkAt: 200, guideAt: 280, endAt: 330, outcome: "closed", price: 1280, lastMsg: "プレミアム入りました" },
  { fan: "@ao_book",      persona: "詩織",   personaColor: "#a855f7", startAt: 196, talkAt: 224, guideAt: 300, endAt: 342, outcome: "closed", price: 780,  lastMsg: "入会させてもらいました" },
];

const threadStage = (t: Thread, frame: number): Stage => {
  if (frame < t.startAt) return "new";
  if (frame >= t.endAt) return t.outcome;
  if (frame >= t.guideAt) return "guiding";
  if (frame >= t.talkAt) return "talking";
  return "new";
};

const STAGE_META: Record<Stage, { label: string; color: string }> = {
  new:     { label: "新規DM",     color: "#6b8afd" },
  talking: { label: "AI会話中",   color: "#3dd6d0" },
  guiding: { label: "誘導中",     color: "#e6b450" },
  closed:  { label: "✓ 課金",     color: "#2ecc8f" },
  left:    { label: "離脱",       color: "#5e5570" },
};

// 選択スレッド(常に最新の guiding/talking)のチャット内容(健全)
const SAMPLE_CHAT = [
  { who: "fan", t: "はじめまして！いつも投稿見てます😊" },
  { who: "ai",  t: "わ、ありがとうございます！嬉しいです☺️" },
  { who: "fan", t: "すごく素敵ですね。お仕事は何を？" },
  { who: "ai",  t: "普段はOLしてます〜お休みに撮ってます📷" },
  { who: "fan", t: "もっと写真とか見てみたいです" },
  { who: "ai",  t: "ありがとうございます！実はファンクラブで限定の写真と日常をもっと載せてて☺️ よかったら覗いてみてください→ fanc.lub/mio" },
  { who: "fan", t: "入りました！これからも応援してます" },
  { who: "ai",  t: "ほんとですか嬉しい〜!登録ありがとうございます🙏✨" },
];

const jpy = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export const DMCloserBait: React.FC = () => {
  const frame = useCurrentFrame();

  const received = THREADS.filter((t) => frame >= t.startAt).length;
  const replied = THREADS.filter((t) => frame >= t.talkAt).length;
  const inConvo = THREADS.filter((t) => { const s = threadStage(t, frame); return s === "talking" || s === "guiding"; }).length;
  const closed = THREADS.filter((t) => threadStage(t, frame) === "closed").length;
  const todaySales = THREADS.filter((t) => threadStage(t, frame) === "closed").reduce((s, t) => s + t.price, 0) + 8600;
  const sec = (frame / 30).toFixed(1);
  const convRate = replied > 0 ? ((closed / replied) * 100).toFixed(1) : "0.0";

  // チャット表示: frame で1メッセージずつ
  const chatVisible = Math.min(SAMPLE_CHAT.length, Math.max(0, Math.floor((frame % 240) / 26)));

  // クローズ・トースト
  const closeToasts = THREADS.filter((t) => threadStage(t, frame) === "closed" && frame >= t.endAt && frame < t.endAt + 36).slice(-3);

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: "'Segoe UI', 'Yu Gothic UI', 'Meiryo UI', system-ui, sans-serif" }}>
      {/* トップバー */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, background: C.panelDeep, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 22px", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 25, height: 25, borderRadius: 7, background: `linear-gradient(135deg,${C.pink},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>✉</div>
          <span style={{ color: C.text, fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>dmcloser</span>
          <span style={{ color: C.textVeryDim, fontSize: 11 }}>auto-reply → fanclub funnel</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(46,204,143,0.1)", border: `1px solid ${C.green}44`, borderRadius: 5, color: C.green, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />NSFW filter: on
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(168,85,247,0.12)", border: `1px solid ${C.purple}55`, borderRadius: 5, color: C.purple, fontSize: 11 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple, opacity: Math.sin(frame * 0.25) * 0.3 + 0.7 }} />
            14垢のDMを自動対応中
          </div>
        </div>
      </div>

      {/* 統計帯 */}
      <div style={{ position: "absolute", top: 54, left: 0, right: 0, height: 44, background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 22px", gap: 32 }}>
        {[
          { l: "受信DM", v: `${received}`, c: C.blue },
          { l: "AI返信済み", v: `${replied}`, c: C.cyan },
          { l: "会話中", v: `${inConvo}`, c: C.yellow },
          { l: "クローズ(課金)", v: `${closed}`, c: C.green },
          { l: "転換率", v: `${convRate}%`, c: C.green },
          { l: "本日売上", v: jpy(todaySales), c: C.pink },
          { l: "平均応答", v: "1.4s", c: C.text },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ color: C.textVeryDim, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>{s.l}</span>
            <span style={{ color: s.c, fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.v}</span>
          </div>
        ))}
      </div>

      {/* 左: DMスレッドリスト */}
      <div style={{ position: "absolute", top: 108, left: 18, width: 1080, bottom: 16, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "150px 90px 1fr 110px 80px", gap: 12, padding: "10px 18px", background: C.panelDeep, borderBottom: `1px solid ${C.border}`, color: C.textVeryDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
          <span>FROM</span><span>担当</span><span>直近メッセージ</span><span>STATUS</span><span style={{ textAlign: "right" }}>金額</span>
        </div>
        <div>
          {THREADS.filter((t) => frame >= t.startAt).slice(-13).map((t, i) => {
            const stg = threadStage(t, frame);
            const m = STAGE_META[stg];
            const closing = stg === "closed";
            const just = closing && frame - t.endAt < 14;
            return (
              <div key={t.fan} style={{ display: "grid", gridTemplateColumns: "150px 90px 1fr 110px 80px", gap: 12, padding: "9px 18px", borderBottom: `1px solid ${C.border}33`, alignItems: "center", fontSize: 11.5, background: just ? `rgba(46,204,143,${0.1 * (1 - (frame - t.endAt) / 14)})` : "transparent" }}>
                <span style={{ color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{t.fan}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", background: t.personaColor, flexShrink: 0 }} />
                  <span style={{ color: C.text }}>{t.persona}</span>
                </span>
                <span style={{ color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {stg === "new" ? <span style={{ color: C.blue }}>新着DM…</span> :
                   stg === "talking" ? <span style={{ color: C.cyan }}>AIが会話中{".".repeat((Math.floor(frame / 8) % 3) + 1)}</span> :
                   stg === "guiding" ? <span style={{ color: C.yellow }}>ファンクラブ案内中…</span> :
                   t.lastMsg}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, opacity: (stg === "talking" || stg === "guiding") ? Math.sin(frame * 0.3) * 0.4 + 0.6 : 1 }} />
                  <span style={{ color: m.color, fontSize: 10.5 }}>{m.label}</span>
                </span>
                <span style={{ textAlign: "right", color: closing ? C.green : C.textVeryDim, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {closing ? `+${jpy(t.price)}` : "—"}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "7px 18px", background: C.panelDeep, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", color: C.textVeryDim, fontSize: 10 }}>
          <span>policy: 健全なファン対応のみ · 性的会話ブロック · ファンクラブ案内は会話3往復後</span>
          <span style={{ color: C.green }}>● 0 violations · auto-moderated</span>
        </div>
      </div>

      {/* 右: 会話プレビュー + ファネル */}
      <div style={{ position: "absolute", top: 108, right: 18, width: 600, bottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* チャットプレビュー */}
        <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", background: C.panelDeep, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: C.pink }} />
            <span style={{ color: C.text, fontWeight: 700 }}>美緒</span>
            <span style={{ color: C.textVeryDim, fontSize: 10 }}>↔ @takashi_pp</span>
            <span style={{ marginLeft: "auto", color: C.cyan, fontSize: 10 }}>● AI auto-pilot</span>
          </div>
          <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
            {SAMPLE_CHAT.slice(0, chatVisible).map((m, i) => (
              <div key={i} style={{ alignSelf: m.who === "ai" ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                <div style={{ color: C.textVeryDim, fontSize: 9, marginBottom: 2, textAlign: m.who === "ai" ? "right" : "left" }}>
                  {m.who === "ai" ? "美緒 (AI)" : "@takashi_pp"}
                </div>
                <div style={{ background: m.who === "ai" ? `linear-gradient(135deg,${C.pink},${C.purple})` : C.inbound, color: m.who === "ai" ? "#fff" : C.text, padding: "8px 12px", borderRadius: 12, fontSize: 12, lineHeight: 1.4 }}>
                  {m.t}
                </div>
              </div>
            ))}
            {chatVisible < SAMPLE_CHAT.length && (
              <div style={{ alignSelf: "flex-end", color: C.textVeryDim, fontSize: 11 }}>
                美緒 が入力中{".".repeat((Math.floor(frame / 6) % 3) + 1)}
              </div>
            )}
          </div>
        </div>
        {/* 転換ファネル */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ color: C.text, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>転換ファネル · 本日</div>
          {[
            { l: "DM受信", v: 1284 + received, w: 100, c: C.blue },
            { l: "AI返信", v: 1284 + replied, w: 96, c: C.cyan },
            { l: "会話継続(3往復+)", v: 642 + Math.floor(replied * 0.7), w: 58, c: C.purple },
            { l: "ファンクラブ誘導", v: 388 + Math.floor(replied * 0.5), w: 38, c: C.yellow },
            { l: "課金クローズ", v: 168 + closed, w: 18, c: C.green },
          ].map((f) => (
            <div key={f.l} style={{ marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginBottom: 3 }}>
                <span style={{ color: C.textMuted }}>{f.l}</span>
                <span style={{ color: C.text, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{f.v.toLocaleString()}</span>
              </div>
              <div style={{ height: 7, background: C.panelDeep, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${f.w}%`, background: f.c }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* クローズ・トースト */}
      <div style={{ position: "absolute", top: 106, right: 26, display: "flex", flexDirection: "column", gap: 8, zIndex: 100 }}>
        {closeToasts.map((t) => {
          const age = frame - t.endAt;
          const op = interpolate(age, [0, 4, 28, 36], [0, 1, 1, 0], { extrapolateRight: "clamp" });
          const ty = interpolate(age, [0, 4], [-8, 0], { extrapolateRight: "clamp" });
          return (
            <div key={t.fan} style={{ opacity: op, transform: `translateY(${ty}px)`, background: C.panel, border: `1px solid ${C.green}55`, borderLeft: `3px solid ${C.green}`, borderRadius: 6, padding: "8px 14px", width: 290, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(46,204,143,0.18)", color: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>✓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{t.persona} ファンクラブ加入 <span style={{ color: C.green }}>+{jpy(t.price)}</span></div>
                <div style={{ color: C.textMuted, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{t.fan} · AIクローズ</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
