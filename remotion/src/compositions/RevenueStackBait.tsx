import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

// ============================================================
// RevenueStackBait
// 14裏垢の収益を1画面で合算。垢別ROI / ニッチ別 / どの垢が
// 当たってるかをポートフォリオ分析。"14垢回して月30万" 系。
// 1920×1080、30fps、18秒 (540 frames)
// ============================================================

const C = {
  bg: "#0c0e14",
  panel: "#13161f",
  panelDeep: "#0f1219",
  border: "#222633",
  text: "#e7e9ee",
  textMuted: "#8a90a2",
  textVeryDim: "#565c6e",
  green: "#2ecc8f",
  red: "#ef6b6b",
  yellow: "#e6b450",
  blue: "#4d9fff",
  purple: "#8b5cf6",
  cyan: "#3dd6d0",
  pink: "#ff5c8a",
};

// 収益源 (裏垢の典型的なマネタイズ)
const SRC = [
  { key: "aff",   label: "アフィ",   color: "#ff5c8a" },
  { key: "note",  label: "note",     color: "#3dd6d0" },
  { key: "brain", label: "Brain",    color: "#4d9fff" },
  { key: "salon", label: "サロン",   color: "#8b5cf6" },
  { key: "pr",    label: "PR",       color: "#e6b450" },
  { key: "tip",   label: "投げ銭",   color: "#2ecc8f" },
] as const;

type Acct = {
  handle: string;
  niche: string;
  followers: number;
  monthly: number;        // 今月収益 (JPY)
  mix: number[];          // SRC の比率 (合計1)
  roi: number;            // 投下時間/コスト比
  trend: number;          // 前月比 %
};

const ACCTS: Acct[] = [
  { handle: "@neoki_money",   niche: "自動収益",   followers: 24180, monthly: 78400, mix: [0.18, 0.30, 0.34, 0.10, 0.05, 0.03], roi: 41.2, trend: +34 },
  { handle: "@cursor_oni",    niche: "AI開発",     followers: 18472, monthly: 61200, mix: [0.22, 0.24, 0.28, 0.14, 0.10, 0.02], roi: 33.8, trend: +28 },
  { handle: "@x_grow_hack",   niche: "X運用",      followers: 31840, monthly: 52800, mix: [0.16, 0.34, 0.20, 0.22, 0.06, 0.02], roi: 29.1, trend: +19 },
  { handle: "@ai_haru_lab",   niche: "AI×副業",    followers: 14870, monthly: 38600, mix: [0.30, 0.28, 0.16, 0.12, 0.10, 0.04], roi: 24.7, trend: +22 },
  { handle: "@prompt_god",    niche: "プロンプト", followers: 12480, monthly: 27400, mix: [0.20, 0.40, 0.18, 0.08, 0.10, 0.04], roi: 21.3, trend: +12 },
  { handle: "@fukugyo_meshi", niche: "副業全般",   followers: 9840,  monthly: 19800, mix: [0.34, 0.30, 0.10, 0.16, 0.06, 0.04], roi: 17.9, trend: +8 },
  { handle: "@kabu_zero_n",   niche: "投資/NISA",  followers: 16240, monthly: 18200, mix: [0.42, 0.18, 0.08, 0.06, 0.22, 0.04], roi: 12.4, trend: -4 },
  { handle: "@ai_e_kasegu",   niche: "AI画像",     followers: 7420,  monthly: 14600, mix: [0.24, 0.36, 0.14, 0.10, 0.12, 0.04], roi: 15.1, trend: +14 },
  { handle: "@code_nashi",    niche: "ノーコード", followers: 8470,  monthly: 11200, mix: [0.18, 0.34, 0.22, 0.14, 0.08, 0.04], roi: 11.7, trend: +6 },
  { handle: "@sleep_ceo",     niche: "自動化",     followers: 11240, monthly: 9800,  mix: [0.20, 0.30, 0.20, 0.10, 0.16, 0.04], roi: 9.8,  trend: +3 },
  { handle: "@toushi_neko",   niche: "投資",       followers: 5240,  monthly: 6400,  mix: [0.46, 0.20, 0.06, 0.04, 0.20, 0.04], roi: 7.2,  trend: -2 },
  { handle: "@side_ai_jp",    niche: "AI副業",     followers: 3870,  monthly: 4200,  mix: [0.28, 0.32, 0.10, 0.10, 0.16, 0.04], roi: 5.9,  trend: +9 },
  { handle: "@nocode_oni",    niche: "ノーコード", followers: 2940,  monthly: 2800,  mix: [0.22, 0.40, 0.08, 0.06, 0.20, 0.04], roi: 4.1,  trend: +4 },
  { handle: "@money_bot_x",   niche: "テスト垢",   followers: 1240,  monthly: 900,   mix: [0.30, 0.30, 0.00, 0.00, 0.36, 0.04], roi: 1.8,  trend: -8 },
];

const fmt = (n: number) => Math.round(n).toLocaleString("ja-JP");
const jpy = (n: number) => `¥${fmt(n)}`;

// 入金トースト
type Toast = { at: number; handle: string; src: string; amount: number };
const SRC_LABEL = ["アフィ", "note", "Brain", "サロン", "PR", "Tip"];
const rnd = (s: number, m: number) => Math.floor((Math.sin(s * 73.13) * 8123.7 % m + m)) % m;
const TOASTS: Toast[] = Array.from({ length: 26 }, (_, i) => {
  const a = ACCTS[rnd(i + 1, 9)]; // 上位9垢に偏らせる
  const si = rnd(i + 3, 6);
  const amt = [980, 1200, 1480, 1247, 2980, 500, 9800, 3741, 1980, 5800][rnd(i + 5, 10)];
  return { at: 20 + i * 18, handle: a.handle, src: SRC_LABEL[si], amount: amt };
});

export const RevenueStackBait: React.FC = () => {
  const frame = useCurrentFrame();
  const growth = 1 + frame * 0.00042;

  const totalMonthly = ACCTS.reduce((s, a) => s + a.monthly * growth, 0);
  const todayIn = TOASTS.filter((t) => frame >= t.at).reduce((s, t) => s + t.amount, 0) + 12400;
  const winners = ACCTS.filter((a) => a.monthly >= 20000).length;
  const avgRoi = (ACCTS.reduce((s, a) => s + a.roi, 0) / ACCTS.length).toFixed(1);
  const mrr = totalMonthly;
  const sec = (frame / 30).toFixed(1);

  // ソート (収益順、既にソート済みだが念のため)
  const ranked = [...ACCTS].sort((a, b) => b.monthly - a.monthly);
  const maxMonthly = ranked[0].monthly;

  // 収益源別合計
  const srcTotals = SRC.map((_, si) => ACCTS.reduce((s, a) => s + a.monthly * a.mix[si], 0));
  const srcGrand = srcTotals.reduce((s, v) => s + v, 0);

  // ニッチ別集計
  const nicheMap: Record<string, { rev: number; cnt: number }> = {};
  ACCTS.forEach((a) => {
    if (!nicheMap[a.niche]) nicheMap[a.niche] = { rev: 0, cnt: 0 };
    nicheMap[a.niche].rev += a.monthly;
    nicheMap[a.niche].cnt += 1;
  });
  const nicheRank = Object.entries(nicheMap).sort((x, y) => y[1].rev - x[1].rev).slice(0, 6);
  const nicheMax = nicheRank[0][1].rev;

  const liveToasts = TOASTS.filter((t) => frame >= t.at && frame < t.at + 36).slice(-4);

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: "'Segoe UI', 'Yu Gothic UI', 'Meiryo UI', system-ui, sans-serif" }}>
      {/* トップバー */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, background: C.panelDeep, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg,${C.green},${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#04130d", fontWeight: 800, fontSize: 14 }}>¥</div>
          <span style={{ color: C.text, fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>revstack</span>
          <span style={{ color: C.textVeryDim, fontSize: 12 }}>multi-account revenue portfolio</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", background: "rgba(46,204,143,0.1)", border: `1px solid ${C.green}44`, borderRadius: 6, color: C.green, fontSize: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, opacity: Math.sin(frame * 0.25) * 0.3 + 0.7 }} />
          <span>14 垢稼働中 · 自動運用</span>
        </div>
      </div>

      {/* KPIストリップ */}
      <div style={{ position: "absolute", top: 56, left: 0, right: 0, height: 78, background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 14 }}>
        {[
          { l: "合計 MRR", v: jpy(mrr), sub: "14垢 合算", c: C.green, big: true },
          { l: "今月合計", v: jpy(totalMonthly * 1.0), sub: "確定", c: C.text },
          { l: "今日の入金", v: jpy(todayIn), sub: `+${TOASTS.filter((t) => frame >= t.at).length}件`, c: C.green },
          { l: "当たり垢", v: `${winners} / 14`, sub: "月2万+", c: C.cyan },
          { l: "平均ROI", v: `×${avgRoi}`, sub: "時間対効果", c: C.yellow },
          { l: "運用コスト", v: jpy(8400 + Math.floor(frame * 1.2)), sub: "API+proxy", c: C.textMuted },
        ].map((k, i) => (
          <div key={i} style={{ flex: k.big ? 1.3 : 1, background: C.panel, border: `1px solid ${i === 0 ? C.green + "55" : C.border}`, borderRadius: 8, padding: "10px 16px" }}>
            <div style={{ color: C.textVeryDim, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.4 }}>{k.l}</div>
            <div style={{ color: k.c, fontSize: k.big ? 26 : 20, fontWeight: 800, marginTop: 3, fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>{k.v}</div>
            <div style={{ color: C.textVeryDim, fontSize: 10, marginTop: 1 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* 左: 垢別収益テーブル */}
      <div style={{ position: "absolute", top: 146, left: 24, width: 1180, bottom: 20, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "30px 160px 100px 90px 120px 1fr 70px 60px", gap: 12, padding: "10px 18px", background: C.panelDeep, borderBottom: `1px solid ${C.border}`, color: C.textVeryDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
          <span>#</span><span>ACCOUNT</span><span>NICHE</span><span style={{ textAlign: "right" }}>FOLLOWERS</span><span style={{ textAlign: "right" }}>今月</span><span>収益源 MIX</span><span style={{ textAlign: "right" }}>ROI</span><span style={{ textAlign: "right" }}>前月</span>
        </div>
        <div>
          {ranked.map((a, i) => {
            const m = a.monthly * growth;
            return (
              <div key={a.handle} style={{ display: "grid", gridTemplateColumns: "30px 160px 100px 90px 120px 1fr 70px 60px", gap: 12, padding: "8px 18px", borderBottom: i < ranked.length - 1 ? `1px solid ${C.border}33` : "none", alignItems: "center", fontSize: 11.5 }}>
                <span style={{ color: i < 3 ? C.yellow : C.textVeryDim, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
                <span style={{ color: C.cyan, fontFamily: "'JetBrains Mono', monospace" }}>{a.handle}</span>
                <span style={{ color: C.textMuted, fontSize: 10.5 }}>{a.niche}</span>
                <span style={{ textAlign: "right", color: C.textMuted, fontVariantNumeric: "tabular-nums" }}>{fmt(a.followers)}</span>
                <span style={{ textAlign: "right", color: C.text, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{jpy(m)}</span>
                {/* 収益源 mix バー */}
                <div style={{ display: "flex", height: 9, borderRadius: 3, overflow: "hidden" }}>
                  {a.mix.map((r, si) => r > 0 && (
                    <div key={si} style={{ width: `${r * 100}%`, background: SRC[si].color }} title={SRC[si].label} />
                  ))}
                </div>
                <span style={{ textAlign: "right", color: a.roi > 20 ? C.green : C.textMuted, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>×{a.roi}</span>
                <span style={{ textAlign: "right", color: a.trend >= 0 ? C.green : C.red, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{a.trend >= 0 ? "+" : ""}{a.trend}%</span>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "7px 18px", background: C.panelDeep, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", color: C.textVeryDim, fontSize: 10 }}>
          <span>収益源:&nbsp;
            {SRC.map((s) => <span key={s.key} style={{ marginRight: 10 }}><span style={{ display: "inline-block", width: 8, height: 8, background: s.color, borderRadius: 2, marginRight: 3 }} />{s.label}</span>)}
          </span>
          <span style={{ color: C.green }}>● AI提案: @neoki_money に予算寄せ (ROI×41)</span>
        </div>
      </div>

      {/* 右: 収益源別 + ニッチランキング */}
      <div style={{ position: "absolute", top: 146, right: 24, width: 600, bottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* 収益源別 */}
        <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>収益源別 · 14垢合計</div>
          {SRC.map((s, si) => {
            const v = srcTotals[si];
            const pct = (v / srcGrand) * 100;
            return (
              <div key={s.key} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: C.textMuted }}><span style={{ display: "inline-block", width: 8, height: 8, background: s.color, borderRadius: 2, marginRight: 6 }} />{s.label}</span>
                  <span style={{ color: C.text, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{jpy(v)} <span style={{ color: C.textVeryDim }}>({pct.toFixed(0)}%)</span></span>
                </div>
                <div style={{ height: 6, background: C.panelDeep, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: s.color }} />
                </div>
              </div>
            );
          })}
        </div>
        {/* ニッチ別ROIランキング */}
        <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>ニッチ別 · どこが当たってるか</div>
          {nicheRank.map(([niche, d], i) => (
            <div key={niche} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ width: 16, color: i === 0 ? C.yellow : C.textVeryDim, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: C.text, fontSize: 11, fontWeight: 500 }}>{niche} <span style={{ color: C.textVeryDim, fontSize: 10 }}>· {d.cnt}垢</span></span>
                  <span style={{ color: C.green, fontSize: 11, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{jpy(d.rev)}</span>
                </div>
                <div style={{ height: 5, background: C.panelDeep, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(d.rev / nicheMax) * 100}%`, background: `linear-gradient(90deg,${C.green},${C.cyan})` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 入金トースト */}
      <div style={{ position: "absolute", top: 144, right: 28, display: "flex", flexDirection: "column", gap: 8, zIndex: 100 }}>
        {liveToasts.map((t) => {
          const age = frame - t.at;
          const op = interpolate(age, [0, 4, 28, 36], [0, 1, 1, 0], { extrapolateRight: "clamp" });
          const ty = interpolate(age, [0, 4], [-8, 0], { extrapolateRight: "clamp" });
          return (
            <div key={t.at} style={{ opacity: op, transform: `translateY(${ty}px)`, background: C.panel, border: `1px solid ${C.green}55`, borderLeft: `3px solid ${C.green}`, borderRadius: 6, padding: "8px 14px", width: 280, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(46,204,143,0.18)", color: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>+</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{t.src} <span style={{ color: C.green }}>{jpy(t.amount)}</span></div>
                <div style={{ color: C.textMuted, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{t.handle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
