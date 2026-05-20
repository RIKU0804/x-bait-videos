import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

// ============================================================
// AccountFarmBait
// 新規垢を量産 → "凍結されない人間っぽさ" まで自動ウォームアップ。
// 垢作成 → プロフ → 初期周回 → 運用解禁 の工程を14垢が並列で進む。
// 1920×1080、30fps、18秒 (540 frames)
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
  purple: "#a371f7",
  cyan: "#39d0d8",
};

const STAGES = [
  "created", "verify", "profile", "avatar", "follow×20",
  "tl browse", "like ×N", "reply ×3", "first post", "active",
];

type Acct = {
  handle: string;
  ageDays: number;
  device: string;
  proxy: string;
  startAt: number;
  speed: number; // ステージ進行のフレーム/段
};

const ACCTS: Acct[] = [
  { handle: "@ai_haru_lab",   ageDays: 21, device: "iPhone 15",   proxy: "JP residential", startAt: 0,   speed: 12 },
  { handle: "@kabu_zero_n",   ageDays: 18, device: "Pixel 8",     proxy: "JP residential", startAt: 6,   speed: 13 },
  { handle: "@fukugyo_meshi", ageDays: 16, device: "iPhone 14",   proxy: "JP mobile LTE",  startAt: 10,  speed: 12 },
  { handle: "@cursor_oni",    ageDays: 14, device: "Galaxy S24",  proxy: "JP residential", startAt: 14,  speed: 14 },
  { handle: "@neoki_money",   ageDays: 12, device: "iPhone 13",   proxy: "JP mobile LTE",  startAt: 20,  speed: 12 },
  { handle: "@x_grow_hack",   ageDays: 11, device: "Web/Brave",   proxy: "JP datacenter",  startAt: 26,  speed: 15 },
  { handle: "@ai_e_kasegu",   ageDays: 9,  device: "iPhone 15 Pro",proxy: "JP residential", startAt: 32,  speed: 13 },
  { handle: "@code_nashi",    ageDays: 8,  device: "Pixel 7",     proxy: "JP mobile LTE",  startAt: 40,  speed: 14 },
  { handle: "@prompt_god",    ageDays: 7,  device: "iPhone 14",   proxy: "JP residential", startAt: 48,  speed: 13 },
  { handle: "@sleep_ceo",     ageDays: 6,  device: "Galaxy S23",  proxy: "JP residential", startAt: 56,  speed: 14 },
  { handle: "@toushi_neko",   ageDays: 5,  device: "iPhone 15",   proxy: "JP mobile LTE",  startAt: 66,  speed: 13 },
  { handle: "@side_ai_jp",    ageDays: 4,  device: "Web/Chrome",  proxy: "JP datacenter",  startAt: 78,  speed: 16 },
  { handle: "@nocode_oni",    ageDays: 3,  device: "Pixel 8 Pro", proxy: "JP residential", startAt: 92,  speed: 14 },
  { handle: "@money_bot_x",   ageDays: 2,  device: "iPhone 13",   proxy: "JP mobile LTE",  startAt: 108, speed: 15 },
];

const acctState = (a: Acct, frame: number) => {
  if (frame < a.startAt) return { stage: 0, active: false };
  const step = Math.floor((frame - a.startAt) / a.speed);
  if (step >= STAGES.length - 1) return { stage: STAGES.length - 1, active: true };
  return { stage: step, active: false };
};

// human-like score: エイジング + 進行度で上昇
const humanScore = (a: Acct, frame: number) => {
  const { stage } = acctState(a, frame);
  const base = Math.min(40, a.ageDays * 2);
  const prog = (stage / (STAGES.length - 1)) * 52;
  return Math.min(99, Math.round(base + prog + Math.sin(frame * 0.05 + a.ageDays) * 2));
};

// ライブアクションログ生成 (人間っぽいランダム間隔)
const LOG_TPL = [
  { c: "#7d8590", t: "{h} idle scroll {n}s · gap {g}s" },
  { c: "#3fb950", t: "{h} ✓ liked {n} posts · spaced {g}s" },
  { c: "#58a6ff", t: "{h} followed @{tgt} (mutual niche)" },
  { c: "#7d8590", t: "{h} dwell on tweet {n}s (read)" },
  { c: "#3fb950", t: "{h} ✓ profile bio updated" },
  { c: "#a371f7", t: "{h} replied: \"{rep}\"" },
  { c: "#7d8590", t: "{h} opened DMs · no action (human-like)" },
  { c: "#3fb950", t: "{h} ✓ first post published" },
  { c: "#d29922", t: "{h} cooldown 6m (rate spacing)" },
  { c: "#58a6ff", t: "{h} device fingerprint rotated" },
  { c: "#3fb950", t: "{h} ✓ avatar + header set" },
  { c: "#7d8590", t: "{h} session ended ({n}m) · resume in {g}m" },
];
const TGT = ["ai_news_jp", "fukugyo_now", "nisa_kun", "indie_dev_x", "prompt_share"];
const REP = ["参考になります", "それ気になってました", "保存しました", "わかる", "勉強になります"];
const rnd = (s: number, m: number) => Math.floor((Math.sin(s * 91.7) * 4391.3 % m + m)) % m;

type Log = { at: number; c: string; t: string };
const LOGS: Log[] = Array.from({ length: 130 }, (_, i) => {
  const at = i * 4 + rnd(i, 3);
  const tpl = LOG_TPL[rnd(i + 5, LOG_TPL.length)];
  const h = ACCTS[rnd(i + 1, ACCTS.length)].handle;
  return {
    at,
    c: tpl.c,
    t: tpl.t
      .replace("{h}", h)
      .replace("{n}", String(rnd(i + 2, 40) + 3))
      .replace("{g}", String(rnd(i + 3, 90) + 12))
      .replace("{tgt}", TGT[rnd(i + 4, TGT.length)])
      .replace("{rep}", REP[rnd(i + 6, REP.length)]),
  };
});

export const AccountFarmBait: React.FC = () => {
  const frame = useCurrentFrame();
  const activeCount = ACCTS.filter((a) => acctState(a, frame).active).length;
  const startedCount = ACCTS.filter((a) => frame >= a.startAt).length;
  const avgScore = Math.round(ACCTS.reduce((s, a) => s + humanScore(a, frame), 0) / ACCTS.length);
  const totalActions = 2847 + Math.floor(frame * 6.2);
  const sec = (frame / 30).toFixed(1);
  const visibleLogs = LOGS.filter((l) => frame >= l.at).slice(-16);

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace" }}>
      {/* タイトルバー (Windows風) */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 32, background: "#0c0c0c", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "stretch" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", color: C.text, fontSize: 12, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
          <span style={{ color: C.green, fontWeight: 700 }}>▣</span>
          <span style={{ fontWeight: 500 }}>accountfarm — warmup orchestrator</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "stretch" }}>
          <div style={{ width: 46, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 12 }}>─</div>
          <div style={{ width: 46, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 10 }}>▢</div>
          <div style={{ width: 46, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 11 }}>✕</div>
        </div>
      </div>

      {/* ステータスライン */}
      <div style={{ position: "absolute", top: 32, left: 0, right: 0, height: 26, background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 20, color: C.textMuted, fontSize: 11 }}>
        <span style={{ color: C.text, fontWeight: 600 }}>accountfarm v2.3</span>
        <span><span style={{ color: C.textVeryDim }}>warming </span>{startedCount - activeCount}</span>
        <span><span style={{ color: C.textVeryDim }}>active </span><span style={{ color: C.green }}>{activeCount}</span></span>
        <span><span style={{ color: C.textVeryDim }}>avg human-like </span><span style={{ color: avgScore > 70 ? C.green : C.yellow }}>{avgScore}/100</span></span>
        <span><span style={{ color: C.textVeryDim }}>actions/24h </span>{totalActions.toLocaleString()}</span>
        <span><span style={{ color: C.textVeryDim }}>flags </span><span style={{ color: C.green }}>0 detected</span></span>
        <span style={{ marginLeft: "auto", color: C.green }}>● {sec}s · all sessions human-paced</span>
      </div>

      {/* 垢テーブル */}
      <div style={{ position: "absolute", top: 70, left: 16, right: 360, bottom: 16, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "150px 50px 110px 130px 1fr 90px 86px", gap: 12, padding: "9px 16px", background: "#10151b", borderBottom: `1px solid ${C.border}`, color: C.textVeryDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
          <span>HANDLE</span><span>AGE</span><span>DEVICE</span><span>PROXY</span><span>WARMUP STAGE</span><span style={{ textAlign: "right" }}>HUMAN%</span><span>STATUS</span>
        </div>
        <div>
          {ACCTS.map((a, i) => {
            const { stage, active } = acctState(a, frame);
            const score = humanScore(a, frame);
            const started = frame >= a.startAt;
            const scoreColor = score > 75 ? C.green : score > 50 ? C.yellow : C.red;
            return (
              <div key={a.handle} style={{ display: "grid", gridTemplateColumns: "150px 50px 110px 130px 1fr 90px 86px", gap: 12, padding: "7px 16px", borderBottom: i < ACCTS.length - 1 ? `1px solid ${C.border}33` : "none", color: C.text, fontSize: 11, alignItems: "center", opacity: started ? 1 : 0.35 }}>
                <span style={{ color: C.cyan }}>{a.handle}</span>
                <span style={{ color: C.textMuted }}>{a.ageDays}d</span>
                <span style={{ color: C.textMuted, fontSize: 10 }}>{a.device}</span>
                <span style={{ color: C.textMuted, fontSize: 10 }}>{a.proxy}</span>
                {/* ステージ進捗 */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 5, background: "#161b22", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(stage / (STAGES.length - 1)) * 100}%`, background: active ? C.green : C.blue }} />
                  </div>
                  <span style={{ fontSize: 9.5, color: active ? C.green : C.textMuted, width: 64 }}>{started ? STAGES[stage] : "queued"}</span>
                </div>
                <span style={{ textAlign: "right", color: scoreColor, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{started ? score : "—"}</span>
                <span style={{ color: active ? C.green : started ? C.yellow : C.textVeryDim }}>
                  {active ? "✓ 運用解禁" : started ? "● warming" : "○ queued"}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 16px", background: "#10151b", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", color: C.textVeryDim, fontSize: 10 }}>
          <span>warmup policy: human-paced · action gap 12–180s · session 8–40m · device-isolated</span>
          <span style={{ color: C.green }}>● no captcha · no challenge · 0 suspended</span>
        </div>
      </div>

      {/* 右: ライブアクションログ + ポリシー */}
      <div style={{ position: "absolute", top: 70, right: 16, width: 332, bottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "7px 12px", background: "#10151b", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>
            <span>● live · human-paced actions</span>
            <span style={{ color: C.green }}>{LOGS.filter((l) => frame >= l.at).length}</span>
          </div>
          <div style={{ flex: 1, padding: "8px 12px", fontSize: 10, lineHeight: 1.5, overflow: "hidden", display: "flex", flexDirection: "column-reverse" }}>
            <div>
              {visibleLogs.map((l, i) => {
                const ts = (() => { const t = (l.at / 30 + 600) | 0; return `${Math.floor(t / 60).toString().padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`; })();
                return (
                  <div key={`${l.at}-${i}`} style={{ display: "flex", gap: 6, marginBottom: 1 }}>
                    <span style={{ color: C.textVeryDim, flexShrink: 0 }}>{ts}</span>
                    <span style={{ color: l.c, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* 検知回避ポリシー */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, padding: "10px 12px" }}>
          <div style={{ color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>detection-avoidance</div>
          {[
            { k: "action spacing", v: "12–180s ✓", c: C.green },
            { k: "device isolation", v: "14/14 ✓", c: C.green },
            { k: "residential proxy", v: "11/14", c: C.green },
            { k: "fingerprint rotate", v: "every session", c: C.green },
            { k: "shadowban check", v: "0 flagged", c: C.green },
            { k: "human-pace model", v: "v2.3 active", c: C.cyan },
          ].map((r) => (
            <div key={r.k} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 10, color: C.textMuted }}>
              <span>{r.k}</span>
              <span style={{ color: r.c }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
