import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

// ============================================================
// PersonaForgeBait
// 「属性を入力 → 16人のAI美女アカウントが一括生成」
// ビジュアル(seed固定で一貫) + キャラ設定 + 収益動線を全自動。
// ※実在人物画像は扱わない。キャラメイクUIの演出。NSFW filter: on
// 1920×1080、30fps、20秒 (600 frames)
// ============================================================

const C = {
  bg: "#0c0a12",
  panel: "#15121d",
  panelDeep: "#100e17",
  border: "#2a2436",
  text: "#efe9f5",
  textMuted: "#9a8fae",
  textVeryDim: "#5e5570",
  accent: "#d946a0",
  pink: "#ec4899",
  purple: "#a855f7",
  green: "#2ecc8f",
  yellow: "#e6b450",
  cyan: "#3dd6d0",
  blue: "#6b8afd",
};

// キャラのビジュアルseed → グラデ4枚 (実画像なし、色で一貫性を表現)
const PALETTES = [
  ["#f9a8d4", "#f472b6", "#db2777", "#be185d"],
  ["#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed"],
  ["#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9"],
  ["#fde68a", "#fcd34d", "#fbbf24", "#f59e0b"],
  ["#a7f3d0", "#6ee7b7", "#34d399", "#10b981"],
  ["#fbcfe8", "#f9a8d4", "#f472b6", "#ec4899"],
  ["#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6"],
  ["#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6"],
];

type Persona = {
  name: string;
  age: number;
  attr: string;     // 属性キャラ
  vibe: string;     // 雰囲気タグ
  bio: string;
  postStyle: string;
  fanclub: number;  // ¥/月
  predFollow: string;
  predSub: string;
  seed: number;
  startAt: number;
};

const PERSONAS: Persona[] = [
  { name: "美緒",   age: 25, attr: "都内OL",       vibe: "清楚",   bio: "平日は会社員｜休日はカフェ巡りと写真｜猫と暮らしてます", postStyle: "日常×自撮り風", fanclub: 980,  predFollow: "+2.4k/月", predSub: "4.2%", seed: 8847291, startAt: 56 },
  { name: "結衣",   age: 23, attr: "看護師",       vibe: "癒し",   bio: "夜勤明けのゆるい投稿が多めです｜コーヒーとサウナが好き", postStyle: "癒し系×日常",   fanclub: 780,  predFollow: "+1.8k/月", predSub: "3.6%", seed: 1029384, startAt: 64 },
  { name: "莉子",   age: 21, attr: "大学生",       vibe: "元気",   bio: "大学3年｜カフェでバイト中｜旅行とカメラにハマってます", postStyle: "学生×お出かけ", fanclub: 580,  predFollow: "+2.9k/月", predSub: "2.8%", seed: 5562738, startAt: 72 },
  { name: "さくら", age: 27, attr: "ヨガ講師",     vibe: "お姉さん", bio: "ヨガとピラティスのインストラクター｜健康と美容の話多め", postStyle: "美容×ライフ",   fanclub: 1280, predFollow: "+1.4k/月", predSub: "5.1%", seed: 3398472, startAt: 80 },
  { name: "七海",   age: 24, attr: "美容部員",     vibe: "知的",   bio: "デパコス担当｜スキンケアとメイクのリアルを発信", postStyle: "美容ノウハウ",  fanclub: 980,  predFollow: "+2.1k/月", predSub: "4.4%", seed: 7741920, startAt: 88 },
  { name: "葵",     age: 22, attr: "カフェ店員",   vibe: "妹系",   bio: "カフェで働いてます｜お菓子作りと読書｜まったり投稿", postStyle: "ほのぼの×日常", fanclub: 480,  predFollow: "+2.6k/月", predSub: "2.4%", seed: 2284756, startAt: 96 },
  { name: "楓",     age: 28, attr: "デザイナー",   vibe: "クール", bio: "フリーランスのデザイナー｜作業風景と日常をゆるく", postStyle: "クリエイティブ", fanclub: 1480, predFollow: "+1.2k/月", predSub: "5.4%", seed: 9913847, startAt: 104 },
  { name: "美咲",   age: 26, attr: "受付",         vibe: "清楚",   bio: "受付のお仕事｜休日はジムとカフェ｜美容にも興味あり", postStyle: "清楚×日常",     fanclub: 880,  predFollow: "+1.9k/月", predSub: "3.9%", seed: 4471028, startAt: 112 },
  { name: "ひなた", age: 20, attr: "美大生",       vibe: "天然",   bio: "美大で絵を描いてます｜制作過程と日常を気ままに", postStyle: "アート×素朴",   fanclub: 580,  predFollow: "+3.2k/月", predSub: "2.6%", seed: 6628194, startAt: 120 },
  { name: "真央",   age: 29, attr: "管理栄養士",   vibe: "お姉さん", bio: "栄養士｜自炊と健康レシピ｜ゆるダイエットの記録", postStyle: "ヘルシー×実用", fanclub: 1080, predFollow: "+1.3k/月", predSub: "4.8%", seed: 1847392, startAt: 128 },
  { name: "杏奈",   age: 24, attr: "アパレル",     vibe: "元気",   bio: "アパレル販売｜今日のコーデと私服｜古着もよく着ます", postStyle: "ファッション",  fanclub: 780,  predFollow: "+2.7k/月", predSub: "3.2%", seed: 5519028, startAt: 136 },
  { name: "玲奈",   age: 27, attr: "事務",         vibe: "知的",   bio: "経理の事務職｜本とコーヒー｜静かな休日が好き", postStyle: "落ち着き×日常", fanclub: 880,  predFollow: "+1.6k/月", predSub: "4.0%", seed: 7283910, startAt: 144 },
  { name: "千夏",   age: 22, attr: "保育士",       vibe: "癒し",   bio: "保育士1年目｜子どもと過ごす毎日｜癒しを届けたい", postStyle: "ほっこり×日常", fanclub: 580,  predFollow: "+2.3k/月", predSub: "2.9%", seed: 3092847, startAt: 152 },
  { name: "美羽",   age: 25, attr: "トレーナー",   vibe: "クール", bio: "パーソナルトレーナー｜トレーニングと食事管理を発信", postStyle: "フィットネス",  fanclub: 1280, predFollow: "+1.5k/月", predSub: "5.0%", seed: 8810293, startAt: 160 },
  { name: "詩織",   age: 26, attr: "図書館司書",   vibe: "清楚",   bio: "図書館で働いてます｜読書記録と静かな日常を綴ります", postStyle: "文学×穏やか",   fanclub: 780,  predFollow: "+1.7k/月", predSub: "3.8%", seed: 2738401, startAt: 168 },
  { name: "心春",   age: 23, attr: "大学院生",     vibe: "天然",   bio: "院で研究中｜カフェ作業と猫｜ゆるっと日常投稿", postStyle: "知的×ゆるさ",   fanclub: 680,  predFollow: "+2.5k/月", predSub: "3.1%", seed: 6471829, startAt: 176 },
];

const STAGES = ["顔モデル", "seed固定", "画像×4", "キャラ設定", "bio生成", "投稿テンプレ", "動線設定", "完成"];
const STAGE_DUR = 7;

const pState = (p: Persona, frame: number) => {
  if (frame < p.startAt) return { stage: -1, done: false, progress: 0 };
  const step = Math.floor((frame - p.startAt) / STAGE_DUR);
  if (step >= STAGES.length) return { stage: STAGES.length, done: true, progress: 1 };
  return { stage: step, done: false, progress: Math.min(1, (frame - p.startAt) / (STAGES.length * STAGE_DUR)) };
};

const jpy = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

// 抽象シルエット (実在人物を描かない・キャラアイコンとしての人型のみ)
const Silhouette: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="14" r="7.5" fill={color} opacity={0.55} />
    <path d="M6 40c0-8.5 6.3-14 14-14s14 5.5 14 14z" fill={color} opacity={0.55} />
  </svg>
);

export const PersonaForgeBait: React.FC = () => {
  const frame = useCurrentFrame();
  const doneCount = PERSONAS.filter((p) => pState(p, frame).done).length;
  const sec = (frame / 30).toFixed(1);

  const totalPredFollow = PERSONAS.filter((p) => pState(p, frame).done)
    .reduce((s, p) => s + parseFloat(p.predFollow), 0);
  const totalSubRev = PERSONAS.filter((p) => pState(p, frame).done)
    .reduce((s, p) => s + p.fanclub * (parseFloat(p.predSub) / 100) * (parseFloat(p.predFollow) * 1000), 0);

  const attr = "清楚系 / 20代 / 日本人女性";
  const typed = frame < 6 ? "" : frame >= 40 ? attr : attr.slice(0, Math.floor(((frame - 6) / 34) * attr.length));

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: "'Segoe UI', 'Yu Gothic UI', 'Meiryo UI', system-ui, sans-serif" }}>
      {/* トップバー */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, background: C.panelDeep, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 22px", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 25, height: 25, borderRadius: 7, background: `linear-gradient(135deg,${C.pink},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>✦</div>
          <span style={{ color: C.text, fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>aimei.studio</span>
          <span style={{ color: C.textVeryDim, fontSize: 11 }}>persona batch generator</span>
        </div>
        <div style={{ flex: 1, maxWidth: 480, height: 30, background: C.panel, border: `1px solid ${frame < 44 ? C.pink : C.border}`, borderRadius: 8, display: "flex", alignItems: "center", padding: "0 12px", gap: 9, color: C.text, fontSize: 12 }}>
          <span style={{ color: C.textVeryDim }}>preset</span>
          <span style={{ color: C.textVeryDim }}>›</span>
          <span>{typed}{frame < 40 && frame >= 6 && <span style={{ display: "inline-block", width: 6, height: 13, marginLeft: 1, background: C.pink, verticalAlign: "middle", opacity: Math.sin(frame * 0.7) > 0 ? 1 : 0 }} />}</span>
          <span style={{ marginLeft: "auto", color: C.textVeryDim, fontSize: 10 }}>16 体</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(46,204,143,0.1)", border: `1px solid ${C.green}44`, borderRadius: 5, color: C.green, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />
          NSFW filter: on
        </div>
        <div style={{ padding: "6px 14px", borderRadius: 8, background: frame < 44 ? C.textVeryDim : `linear-gradient(135deg,${C.pink},${C.purple})`, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
          {frame < 44 ? "生成" : doneCount >= PERSONAS.length ? "✓ 完了" : <><div style={{ width: 9, height: 9, border: "2px solid #ffffff55", borderTopColor: "#fff", borderRadius: "50%", transform: `rotate(${frame * 24}deg)` }} />生成中</>}
        </div>
      </div>

      {/* ステータス帯 */}
      <div style={{ position: "absolute", top: 54, left: 0, right: 0, height: 42, background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 22px", gap: 30 }}>
        {[
          { l: "生成済み", v: `${doneCount} / 16`, c: C.green },
          { l: "経過", v: `${sec}s`, c: C.text },
          { l: "1体あたり", v: "3.7s", c: C.text },
          { l: "顔の一貫性", v: `${(98.7 - Math.sin(frame * 0.05) * 0.4).toFixed(1)}%`, c: C.cyan },
          { l: "キャラ重複", v: "0%", c: C.green },
          { l: "予測フォロワー(計)", v: `+${totalPredFollow.toFixed(1)}k/月`, c: C.yellow },
          { l: "予測サブスク月商", v: jpy(Math.round(totalSubRev)), c: C.pink },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ color: C.textVeryDim, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.3 }}>{s.l}</span>
            <span style={{ color: s.c, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.v}</span>
          </div>
        ))}
      </div>

      {/* 16キャラ 4×4 グリッド */}
      <div style={{ position: "absolute", top: 106, left: 18, right: 18, bottom: 16, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gridTemplateRows: "repeat(4,1fr)", gap: 12 }}>
        {PERSONAS.map((p, i) => {
          const st = pState(p, frame);
          const queued = st.stage === -1;
          const working = !queued && !st.done;
          const pal = PALETTES[i % PALETTES.length];
          const appear = interpolate(frame - p.startAt + 6, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={p.name} style={{ background: C.panel, border: `1px solid ${working ? C.pink + "aa" : C.border}`, borderRadius: 10, padding: 10, display: "flex", gap: 10, opacity: queued ? 0.26 : appear, position: "relative", overflow: "hidden" }}>
              {working && <div style={{ position: "absolute", left: 0, bottom: 0, height: 2, width: `${st.progress * 100}%`, background: C.pink }} />}

              {/* ポートレート枠 + 4枚ミニ */}
              <div style={{ width: 96, flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ flex: 1, borderRadius: 7, background: queued ? C.panelDeep : `linear-gradient(150deg, ${pal[0]}, ${pal[2]})`, position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", minHeight: 96 }}>
                  {!queued && !working && (
                    <>
                      <Silhouette size={70} color="#ffffff" />
                      <div style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "'JetBrains Mono', monospace" }}>AI gen</div>
                      <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "'JetBrains Mono', monospace" }}>seed {p.seed}</div>
                    </>
                  )}
                  {working && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 16, height: 16, border: "2px solid #ffffff55", borderTopColor: "#fff", borderRadius: "50%", transform: `rotate(${frame * 22}deg)` }} />
                    </div>
                  )}
                </div>
                {/* 4枚ミニサムネ */}
                <div style={{ display: "flex", gap: 3 }}>
                  {pal.map((c, ci) => (
                    <div key={ci} style={{ flex: 1, height: 16, borderRadius: 3, background: queued ? C.panelDeep : `linear-gradient(150deg,${c},${pal[(ci + 2) % 4]})`, border: !queued && !working ? `1px solid ${C.green}66` : "none" }} />
                  ))}
                </div>
              </div>

              {/* 右: キャラ情報 */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                {queued ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", color: C.textVeryDim, fontSize: 10 }}>queued</div>
                ) : working ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
                    <div style={{ color: C.pink, fontSize: 12, fontWeight: 700 }}>{STAGES[Math.min(st.stage, STAGES.length - 1)]}…</div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {STAGES.map((s, si) => (
                        <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: si < st.stage ? C.green : si === st.stage ? "#fff" : "#2a2436" }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{p.name}</span>
                      <span style={{ color: C.textMuted, fontSize: 10 }}>{p.age} · {p.attr}</span>
                      <span style={{ marginLeft: "auto", background: `${C.purple}33`, color: C.purple, fontSize: 8.5, padding: "1px 6px", borderRadius: 8 }}>{p.vibe}</span>
                    </div>
                    <div style={{ color: C.textMuted, fontSize: 9.5, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: 26 }}>{p.bio}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <span style={{ background: C.panelDeep, color: C.textMuted, fontSize: 8.5, padding: "2px 6px", borderRadius: 7, border: `1px solid ${C.border}` }}>{p.postStyle}</span>
                    </div>
                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.border}`, paddingTop: 5 }}>
                      <div>
                        <div style={{ color: C.textVeryDim, fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }}>ファンクラブ</div>
                        <div style={{ color: C.pink, fontSize: 12, fontWeight: 700 }}>{jpy(p.fanclub)}<span style={{ color: C.textVeryDim, fontSize: 8 }}>/月</span></div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: C.green, fontSize: 10, fontWeight: 600 }}>{p.predFollow}</div>
                        <div style={{ color: C.textVeryDim, fontSize: 8.5 }}>転換 {p.predSub}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {doneCount >= PERSONAS.length && (
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "rgba(236,72,153,0.14)", border: `1px solid ${C.pink}66`, borderRadius: 8, padding: "8px 18px", color: C.pink, fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
          ● 16体を {sec}s で生成 · 顔一貫 98.7% · そのまま運用キューへ
        </div>
      )}
    </AbsoluteFill>
  );
};
