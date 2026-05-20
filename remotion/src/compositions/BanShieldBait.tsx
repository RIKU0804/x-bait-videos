import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

// ============================================================
// BanShieldBait
// 全裏垢のシャドウバン判定を24h監視。検知→自動クールダウンで
// 凍結ゼロを維持し続けるダッシュボード。
// 1920×1080、30fps、16秒 (480 frames)
// ============================================================

const C = {
  bg: "#0a0d12",
  panel: "#0d1117",
  panelDeep: "#080b10",
  border: "#1f2630",
  text: "#c9d1d9",
  textMuted: "#7d8590",
  textVeryDim: "#5a6168",
  green: "#3fb950",
  yellow: "#d29922",
  red: "#f85149",
  blue: "#58a6ff",
  cyan: "#39d0d8",
};

// シャドウバンの種類 (実際にXコミュニティで使われる用語)
const CHECKS = ["Search Ban", "Reply Deboost", "Ghost Ban", "Thread Deboost", "For-You除外"];

type Acct = { handle: string };
const ACCTS: Acct[] = [
  { handle: "@ai_haru_lab" }, { handle: "@kabu_zero_n" }, { handle: "@fukugyo_meshi" },
  { handle: "@cursor_oni" }, { handle: "@neoki_money" }, { handle: "@x_grow_hack" },
  { handle: "@ai_e_kasegu" }, { handle: "@code_nashi" }, { handle: "@prompt_god" },
  { handle: "@sleep_ceo" }, { handle: "@toushi_neko" }, { handle: "@side_ai_jp" },
  { handle: "@nocode_oni" }, { handle: "@money_bot_x" },
];

// 状態: 0=clear 1=warn 2=detected
type Cell = 0 | 1 | 2;

// frame に応じた判定 (基本 clear、途中で一部 warn → 自動対処 → clear)
const cellState = (acctIdx: number, checkIdx: number, frame: number): Cell => {
  // ドラマ: @x_grow_hack(5) の Reply Deboost(1) が frame 150-230 で warn → 自動対処
  if (acctIdx === 5 && checkIdx === 1) {
    if (frame >= 150 && frame < 215) return 1;
    return 0;
  }
  // @money_bot_x(13) の Search Ban(0) が frame 90-160 で warn
  if (acctIdx === 13 && checkIdx === 0) {
    if (frame >= 90 && frame < 165) return 1;
    return 0;
  }
  // @code_nashi(7) の For-You除外(4) が一瞬 warn
  if (acctIdx === 7 && checkIdx === 4) {
    if (frame >= 260 && frame < 305) return 1;
    return 0;
  }
  return 0;
};

const acctRisk = (acctIdx: number, frame: number) => {
  let r = 0;
  for (let c = 0; c < CHECKS.length; c++) r += cellState(acctIdx, c, frame);
  return r;
};

// 自動対処ログ
type Ev = { at: number; c: string; t: string };
const EVENTS: Ev[] = [
  { at: 30,  c: "#7d8590", t: "[scan] full sweep · 14 accounts · 5 vectors" },
  { at: 48,  c: "#3fb950", t: "[scan] 70/70 checks clear" },
  { at: 92,  c: "#d29922", t: "[detect] @money_bot_x · Search Ban → WARN" },
  { at: 100, c: "#58a6ff", t: "[auto] @money_bot_x · 投稿頻度 -60% / cooldown 8m" },
  { at: 108, c: "#58a6ff", t: "[auto] @money_bot_x · hashtag除去 / mention抑制" },
  { at: 152, c: "#d29922", t: "[detect] @x_grow_hack · Reply Deboost → WARN" },
  { at: 160, c: "#58a6ff", t: "[auto] @x_grow_hack · reply間隔 ×2.5 / 外部リンク停止" },
  { at: 166, c: "#7d8590", t: "[scan] re-check queued in 90s" },
  { at: 168, c: "#3fb950", t: "[recover] @money_bot_x · Search Ban CLEARED" },
  { at: 176, c: "#58a6ff", t: "[auto] @money_bot_x · 通常モード復帰" },
  { at: 218, c: "#3fb950", t: "[recover] @x_grow_hack · Reply Deboost CLEARED" },
  { at: 226, c: "#58a6ff", t: "[auto] 全垢 行動パターン再分散 (entropy +0.18)" },
  { at: 248, c: "#7d8590", t: "[scan] full sweep · 14 accounts" },
  { at: 264, c: "#d29922", t: "[detect] @code_nashi · For-You除外 → WARN" },
  { at: 272, c: "#58a6ff", t: "[auto] @code_nashi · 投稿時間帯シフト / 質問形に変更" },
  { at: 308, c: "#3fb950", t: "[recover] @code_nashi · For-You除外 CLEARED" },
  { at: 320, c: "#3fb950", t: "[scan] 70/70 checks clear · 0 suspended" },
  { at: 348, c: "#7d8590", t: "[scan] full sweep · all clear" },
  { at: 372, c: "#58a6ff", t: "[auto] proxy health ok · fingerprint rotated" },
  { at: 400, c: "#3fb950", t: "[scan] 70/70 clear · uptime 412d · 0 bans" },
  { at: 432, c: "#7d8590", t: "[scan] continuous monitor · interval 45s" },
];

const STATE_COLOR: Record<Cell, string> = { 0: "#3fb950", 1: "#d29922", 2: "#f85149" };
const STATE_LABEL: Record<Cell, string> = { 0: "clear", 1: "warn", 2: "ban" };

export const BanShieldBait: React.FC = () => {
  const frame = useCurrentFrame();

  const totalChecks = ACCTS.length * CHECKS.length;
  let clearCount = 0, warnCount = 0;
  for (let a = 0; a < ACCTS.length; a++)
    for (let c = 0; c < CHECKS.length; c++) {
      const s = cellState(a, c, frame);
      if (s === 0) clearCount++;
      else warnCount++;
    }
  const healthPct = ((clearCount / totalChecks) * 100).toFixed(1);
  const sec = (frame / 30).toFixed(1);
  const visibleEv = EVENTS.filter((e) => frame >= e.at).slice(-14);

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace" }}>
      {/* タイトルバー */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 32, background: "#0c0c0c", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "stretch" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", color: C.text, fontSize: 12, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
          <span style={{ color: C.green, fontWeight: 700 }}>▣</span>
          <span style={{ fontWeight: 500 }}>banshield — account health monitor</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "stretch" }}>
          <div style={{ width: 46, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 12 }}>─</div>
          <div style={{ width: 46, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 10 }}>▢</div>
          <div style={{ width: 46, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 11 }}>✕</div>
        </div>
      </div>

      {/* ステータスライン */}
      <div style={{ position: "absolute", top: 32, left: 0, right: 0, height: 26, background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 20, color: C.textMuted, fontSize: 11 }}>
        <span style={{ color: C.text, fontWeight: 600 }}>banshield v3.1</span>
        <span><span style={{ color: C.textVeryDim }}>監視 </span>{ACCTS.length} accounts × {CHECKS.length} vectors</span>
        <span><span style={{ color: C.textVeryDim }}>health </span><span style={{ color: warnCount > 0 ? C.yellow : C.green }}>{healthPct}%</span></span>
        <span><span style={{ color: C.textVeryDim }}>warn </span><span style={{ color: warnCount > 0 ? C.yellow : C.textMuted }}>{warnCount}</span><span style={{ color: C.textVeryDim }}> (auto-handled)</span></span>
        <span><span style={{ color: C.textVeryDim }}>suspended </span><span style={{ color: C.green }}>0</span></span>
        <span><span style={{ color: C.textVeryDim }}>uptime </span>412d</span>
        <span style={{ marginLeft: "auto", color: C.green }}>● {sec}s · monitor interval 45s</span>
      </div>

      {/* 判定マトリクス */}
      <div style={{ position: "absolute", top: 70, left: 16, right: 360, bottom: 16, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: `170px repeat(${CHECKS.length}, 1fr) 96px`, gap: 10, padding: "10px 16px", background: "#10151b", borderBottom: `1px solid ${C.border}`, color: C.textVeryDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
          <span>ACCOUNT</span>
          {CHECKS.map((c) => <span key={c} style={{ textAlign: "center" }}>{c}</span>)}
          <span style={{ textAlign: "right" }}>RISK</span>
        </div>
        <div>
          {ACCTS.map((a, ai) => {
            const risk = acctRisk(ai, frame);
            return (
              <div key={a.handle} style={{ display: "grid", gridTemplateColumns: `170px repeat(${CHECKS.length}, 1fr) 96px`, gap: 10, padding: "8px 16px", borderBottom: ai < ACCTS.length - 1 ? `1px solid ${C.border}33` : "none", alignItems: "center", fontSize: 11 }}>
                <span style={{ color: C.cyan }}>{a.handle}</span>
                {CHECKS.map((_, ci) => {
                  const s = cellState(ai, ci, frame);
                  const blink = s !== 0 ? Math.sin(frame * 0.4) > 0 : true;
                  return (
                    <div key={ci} style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, opacity: blink ? 1 : 0.5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATE_COLOR[s], boxShadow: s !== 0 ? `0 0 6px ${STATE_COLOR[s]}` : "none" }} />
                        <span style={{ color: STATE_COLOR[s], fontSize: 9.5 }}>{STATE_LABEL[s]}</span>
                      </div>
                    </div>
                  );
                })}
                <span style={{ textAlign: "right", color: risk === 0 ? C.green : C.yellow, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {risk === 0 ? "0.0 ✓" : `${(risk * 1.4).toFixed(1)} ⚠`}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 16px", background: "#10151b", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", color: C.textVeryDim, fontSize: 10 }}>
          <span>checks: search · reply · ghost · thread · for-you  |  re-scan every 45s</span>
          <span style={{ color: C.green }}>● auto-mitigation enabled · 0 manual intervention</span>
        </div>
      </div>

      {/* 右: 自動対処ログ + 防御ポリシー */}
      <div style={{ position: "absolute", top: 70, right: 16, width: 332, bottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "7px 12px", background: "#10151b", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>
            <span>● detect → auto-mitigate</span>
            <span style={{ color: C.green }}>{EVENTS.filter((e) => frame >= e.at).length}</span>
          </div>
          <div style={{ flex: 1, padding: "8px 12px", fontSize: 10, lineHeight: 1.5, overflow: "hidden", display: "flex", flexDirection: "column-reverse" }}>
            <div>
              {visibleEv.map((e, i) => {
                const ts = (() => { const t = (e.at / 30 + 600) | 0; return `${Math.floor(t / 60).toString().padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`; })();
                return (
                  <div key={`${e.at}-${i}`} style={{ display: "flex", gap: 6, marginBottom: 1 }}>
                    <span style={{ color: C.textVeryDim, flexShrink: 0 }}>{ts}</span>
                    <span style={{ color: e.c, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: "10px 12px" }}>
          <div style={{ color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>defense policy</div>
          {[
            { k: "rate spacing", v: "adaptive ✓", c: C.green },
            { k: "behavior entropy", v: "0.87 (high)", c: C.green },
            { k: "link/hashtag ctrl", v: "auto", c: C.green },
            { k: "post-time jitter", v: "±90m", c: C.green },
            { k: "shadowban probe", v: "3rd-party ✓", c: C.green },
            { k: "auto-cooldown", v: "armed", c: C.cyan },
          ].map((r) => (
            <div key={r.k} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 10, color: C.textMuted }}>
              <span>{r.k}</span><span style={{ color: r.c }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
