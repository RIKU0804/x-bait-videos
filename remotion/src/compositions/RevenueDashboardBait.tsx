import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

// ============================================================
// RevenueDashboardBait
// 「自動で稼いでる感」のクリエイター収益統合ダッシュボード。
// note / Brain / BASE / Stripe / Tips / アフィリエイトなど
// 複数の収益ソースから通知が次々と来る。全部 JPY。
// 1920×1080、30fps、18秒 (540 frames)
// ============================================================

const C = {
  bg: "#f6f8fb",
  bgDark: "#0a2540",
  panel: "#ffffff",
  border: "#e3e8ee",
  borderStrong: "#cdd5df",
  text: "#0a2540",
  textMuted: "#697386",
  textVeryDim: "#a3acba",
  accent: "#635bff",
  accentLight: "#dcdaff",
  green: "#0e9f6e",
  greenLight: "#d4eedd",
  red: "#cd3500",
  redLight: "#fce4dd",
  yellow: "#a16207",
  yellowLight: "#fef3c7",
  blue: "#1d4ed8",
  blueLight: "#dbeafe",
  purple: "#7c3aed",
  purpleLight: "#ede9fe",
  pink: "#db2777",
  pinkLight: "#fce7f3",
  gold: "#a16207",
  gridLine: "#eef1f5",
};

// ===== 収益ソースのプリセット =====
type Source = "note" | "brain" | "base" | "stripe" | "tip" | "kindle" | "udemy" | "aff" | "sponsor" | "membership" | "refund";

const SOURCE_META: Record<Source, { label: string; tag: string; color: string; bg: string; icon: string }> = {
  note:       { label: "note",         tag: "記事購入",      color: "#41c9b4", bg: "#e0f7f4", icon: "n" },
  brain:      { label: "Brain",        tag: "コンテンツ販売", color: "#1d4ed8", bg: "#dbeafe", icon: "B" },
  base:       { label: "BASE",         tag: "商品購入",      color: "#10b981", bg: "#d1fae5", icon: "■" },
  stripe:     { label: "Stripe",       tag: "サブスク",      color: "#635bff", bg: "#ede9fe", icon: "S" },
  tip:        { label: "Tip",          tag: "投げ銭",        color: "#f59e0b", bg: "#fef3c7", icon: "♥" },
  kindle:     { label: "Kindle",       tag: "電子書籍",      color: "#0ea5e9", bg: "#e0f2fe", icon: "K" },
  udemy:      { label: "Udemy",        tag: "コース購入",    color: "#a435f0", bg: "#f3e8ff", icon: "U" },
  aff:        { label: "もしも",       tag: "アフィリエイト", color: "#ec4899", bg: "#fce7f3", icon: "%" },
  sponsor:    { label: "Sponsor",      tag: "スポンサー",    color: "#dc2626", bg: "#fee2e2", icon: "★" },
  membership: { label: "memberships",  tag: "メンバー加入",  color: "#7c3aed", bg: "#ede9fe", icon: "✦" },
  refund:     { label: "Refund",       tag: "返金",          color: "#cd3500", bg: "#fce4dd", icon: "↩" },
};

// ===== 通知データ =====
type Toast = {
  at: number;
  source: Source;
  title: string;       // 「note『...』」など
  buyer?: string;      // メアド or @ハンドル
  amount: number;      // JPY (返金は負数)
};

const TOASTS: Toast[] = [
  // 序盤: 細かい note 購入のラッシュ
  { at: 18,  source: "note",       title: "Cursor使い倒し術",                     buyer: "alex@example.com",     amount: 1200 },
  { at: 32,  source: "tip",        title: "Tip from @ai_otoko",                  buyer: "@ai_otoko",            amount: 500 },
  { at: 46,  source: "note",       title: "Claude Code 完全マニュアル",            buyer: "jin.h@example.com",    amount: 980 },
  { at: 62,  source: "aff",        title: "Cursor Pro · 紹介報酬",                buyer: "もしもアフィリエイト",   amount: 1247 },
  { at: 78,  source: "note",       title: "失敗から学ぶSaaS設計",                 buyer: "k.tanaka@gmail.com",   amount: 1500 },
  { at: 92,  source: "membership", title: "自動化ラボ (月額)",                    buyer: "rin@example.com",      amount: 980 },

  // 中盤: 大物 + 種類混ぜる
  { at: 108, source: "brain",      title: "Claude Codeで稼ぐための7つの設計",      buyer: "mira@stratos.io",      amount: 9800 },
  { at: 124, source: "base",       title: "自動投稿テンプレ.zip",                  buyer: "ops@acme.co",          amount: 2980 },
  { at: 140, source: "stripe",     title: "Pro プラン (月額)",                    buyer: "rinne@example.com",    amount: 2980 },
  { at: 154, source: "tip",        title: "Tip from @ren_dev",                   buyer: "@ren_dev",             amount: 1000 },
  { at: 168, source: "note",       title: "Remotion実践入門",                     buyer: "ben@parkside.dev",     amount: 1980 },
  { at: 182, source: "kindle",     title: "副業エンジニア入門",                   buyer: "Kindle",               amount: 487 },

  // 大型: スポンサー (副業レベルにスケール調整)
  { at: 198, source: "sponsor",    title: "PR枠 weekly (3週分)",                   buyer: "acme.co",              amount: 30000 },

  { at: 214, source: "udemy",      title: "Remotionで作るバズ動画",                buyer: "yuto@example.com",     amount: 4800 },
  { at: 228, source: "note",       title: "Cursor使い倒し術",                     buyer: "marie@chrono.app",     amount: 1200 },
  { at: 242, source: "aff",        title: "Vercel · 紹介報酬 ×3",                 buyer: "もしもアフィリエイト",   amount: 3741 },
  { at: 256, source: "stripe",     title: "Team プラン (年額)",                   buyer: "support@indiehack.io", amount: 12800 },

  // ちょっとリアル: 返金 1件
  { at: 270, source: "refund",     title: "Brain · 期待と違った",                  buyer: "p.gomes@example.com",  amount: -9800 },

  { at: 284, source: "note",       title: "Claude Code 完全マニュアル",            buyer: "team@nebula.studio",   amount: 980 },
  { at: 298, source: "membership", title: "自動化ラボ (月額)",                    buyer: "noa@everline.app",     amount: 980 },
  { at: 312, source: "brain",      title: "Claude Codeで稼ぐための7つの設計",      buyer: "growth@payton.io",     amount: 9800 },
  { at: 326, source: "tip",        title: "Tip from @maki_yu",                   buyer: "@maki_yu",             amount: 300 },
  { at: 340, source: "note",       title: "失敗から学ぶSaaS設計",                 buyer: "tom.k@example.com",    amount: 1500 },
  { at: 354, source: "stripe",     title: "Pro プラン (月額)",                    buyer: "ai@beforedawn.dev",    amount: 2980 },
  { at: 368, source: "base",       title: "プロンプト集.pdf",                     buyer: "h.suzuki@example.com", amount: 1480 },
  { at: 382, source: "note",       title: "Remotion実践入門",                     buyer: "team@orbital.so",      amount: 1980 },
  { at: 396, source: "tip",        title: "Tip from @kuma_eng",                  buyer: "@kuma_eng",            amount: 2000 },
  { at: 410, source: "aff",        title: "Anthropic API · 紹介",                buyer: "もしもアフィリエイト",   amount: 5800 },
  { at: 424, source: "membership", title: "自動化ラボ (月額)",                    buyer: "maya@parallax.io",     amount: 980 },
  { at: 438, source: "sponsor",    title: "Discord 内紹介枠",                     buyer: "northshore.app",       amount: 12000 },
  { at: 452, source: "note",       title: "Claude Code 完全マニュアル",            buyer: "ren@example.com",      amount: 980 },
  { at: 466, source: "stripe",     title: "Pro プラン (月額)",                    buyer: "billing@meridian.dev", amount: 2980 },
  { at: 480, source: "brain",      title: "Claude Codeで稼ぐための7つの設計",      buyer: "ops@northshore.app",   amount: 9800 },
];

// 商品売上の合計を累積で計算 (動画内のリアル感のため)
const cumulative = (frame: number) =>
  TOASTS.filter((t) => frame >= t.at).reduce((sum, t) => sum + t.amount, 0);

// ===== グラフ用データ (日次売上、副業クリエイター級) =====
const generateRevenueSeries = (frame: number) => {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const base = 3500 + Math.pow(t, 1.8) * 22000;
    const noise = Math.sin(i * 1.9) * 2400 + Math.cos(i * 0.7) * 1800;
    points.push({ x: i, y: base + noise });
  }
  const recentBoost = Math.max(0, (frame - 8) / 2) * 240;
  for (let i = 26; i < 30; i++) {
    points[i].y += recentBoost * (i - 25);
  }
  return points;
};

const fmt = (n: number) => n.toLocaleString("ja-JP");
const jpy = (n: number) => `¥${fmt(n)}`;
const jpySigned = (n: number) => (n < 0 ? `-¥${fmt(-n)}` : `+¥${fmt(n)}`);

export const RevenueDashboardBait: React.FC = () => {
  const frame = useCurrentFrame();

  // ===== KPI: 累積収益で動的に変化 (副業クリエイター級の数字) =====
  const todayBaseline = 8420;
  const todayRevenue   = todayBaseline + cumulative(frame);
  const mrrBase        = 247_200;
  const mrr            = mrrBase + Math.floor(frame * 28);
  const activeSubs     = 142 + TOASTS.filter((t) => (t.source === "stripe" || t.source === "membership") && frame >= t.at).length;
  const churn          = 2.1 - Math.min(0.4, frame * 0.0012);
  const trialConversion= 18.2 + Math.min(3.8, frame * 0.012);
  const newToday       = TOASTS.filter((t) => frame >= t.at && t.amount > 0).length;
  const ytdBase        = 1_847_400;
  const ytdRevenue     = ytdBase + cumulative(frame);

  // ===== グラフ =====
  const series = generateRevenueSeries(frame);
  const gw = 720;
  const gh = 240;
  const minY = Math.min(...series.map((p) => p.y)) * 0.85;
  const maxY = Math.max(...series.map((p) => p.y)) * 1.05;
  const pathD = series
    .map((p, i) => {
      const x = (p.x / 29) * gw;
      const y = gh - ((p.y - minY) / (maxY - minY)) * gh;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const fillD = `${pathD} L${gw},${gh} L0,${gh} Z`;

  // ===== 通知 (最大4件積み上げ、寿命40f) =====
  const liveToasts = TOASTS.filter((t) => frame >= t.at && frame < t.at + 40).slice(-4);

  // ===== 最近の入金リスト (リアクティブに伸びる) =====
  const recentRows = TOASTS.filter((t) => frame >= t.at).slice().reverse().slice(0, 9);

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
          background: C.bgDark,
          display: "flex",
          alignItems: "center",
          padding: "0 28px",
          gap: 28,
        }}
      >
        <span style={{ color: "#fff", fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>
          earnings.dev
        </span>
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6,
            padding: "6px 12px",
            color: "#fff",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ width: 10, height: 10, background: "#fdb022", borderRadius: 2, display: "inline-block" }} />
          studio · creator
          <span style={{ marginLeft: 4 }}>▾</span>
        </div>
        <div style={{ display: "flex", gap: 22, color: "#a3b5cc", fontSize: 13 }}>
          <span style={{ color: "#fff", fontWeight: 500 }}>概要</span>
          <span>収入</span>
          <span>顧客</span>
          <span>商品</span>
          <span>レポート</span>
          <span>連携</span>
        </div>
        <div
          style={{
            marginLeft: "auto",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6,
            padding: "6px 14px",
            color: "#a3b5cc",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: 220,
          }}
        >
          <span>⌕</span>
          <span>検索</span>
          <span style={{ marginLeft: "auto", fontSize: 10 }}>Ctrl+K</span>
        </div>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "#e01e5a",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          S
        </div>
      </div>

      {/* ====== ページ見出し ====== */}
      <div style={{ position: "absolute", top: 56, left: 0, right: 0, padding: "20px 36px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ color: C.textMuted, fontSize: 13 }}>2026-05-17 · 今日</div>
            <div style={{ color: C.text, fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginTop: 2 }}>
              収入の概要
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: "6px 12px",
                color: C.text,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              直近30日 ▾
            </div>
            <div
              style={{
                background: C.accent,
                color: "#fff",
                borderRadius: 6,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              + 出品
            </div>
          </div>
        </div>
      </div>

      {/* ====== KPIカード (スパークライン付き) ====== */}
      <div
        style={{
          position: "absolute",
          top: 138,
          left: 36,
          right: 36,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 14,
        }}
      >
        {[
          { label: "今日の売上",     value: jpy(todayRevenue),                 delta: "+24.7%", trend: "up",   color: C.green },
          { label: "MRR (継続収益)", value: jpy(mrr),                          delta: "+8.7%",  trend: "up",   color: C.green },
          { label: "有料会員",       value: fmt(activeSubs),                   delta: `+${newToday}`,         trend: "up",   color: C.green },
          { label: "無料 → 有料",    value: `${trialConversion.toFixed(1)}%`,  delta: "+2.4pt", trend: "up",   color: C.green },
          { label: "解約率",         value: `${churn.toFixed(2)}%`,            delta: "-0.4pt", trend: "down", color: C.green },
        ].map((k, i) => {
          // 各KPI 用のスパークラインデータ生成
          const sparkSeed = i * 17;
          const points: number[] = [];
          for (let j = 0; j < 24; j++) {
            const t = j / 23;
            const baseVal = k.trend === "down"
              ? 80 - t * 30 - Math.sin(j + sparkSeed) * 8
              : 30 + t * 50 + Math.sin(j + sparkSeed) * 8;
            // ライブで右端が動く
            const liveBoost = j === 23 ? Math.sin(frame * 0.1) * 4 : 0;
            points.push(Math.max(5, Math.min(95, baseVal + liveBoost)));
          }
          const pathD = points
            .map((v, j) => {
              const x = (j / 23) * 100;
              const y = 30 - (v / 100) * 28;
              return `${j === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");
          const fillD = `${pathD} L100,30 L0,30 Z`;

          return (
            <div
              key={i}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "12px 16px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ color: C.textMuted, fontSize: 12, fontWeight: 500 }}>{k.label}</div>
              <div
                style={{
                  color: C.text,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: -0.5,
                  marginTop: 4,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {k.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span
                  style={{
                    background: C.greenLight,
                    color: k.color,
                    borderRadius: 3,
                    padding: "1px 6px",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {k.delta}
                </span>
                <span style={{ color: C.textVeryDim, fontSize: 11 }}>vs 先週</span>
              </div>
              {/* スパークライン */}
              <svg
                viewBox="0 0 100 30"
                preserveAspectRatio="none"
                style={{ position: "absolute", right: 12, top: 12, width: 80, height: 30 }}
              >
                <defs>
                  <linearGradient id={`spk-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.accent} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path d={fillD} fill={`url(#spk-${i})`} />
                <path d={pathD} stroke={C.accent} strokeWidth={1.3} fill="none" />
              </svg>
            </div>
          );
        })}
      </div>

      {/* ====== グラフ ====== */}
      <div
        style={{
          position: "absolute",
          top: 270,
          left: 36,
          width: 820,
          height: 380,
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: C.textMuted, fontSize: 13, fontWeight: 500 }}>総収益 (直近30日)</div>
            <div
              style={{
                color: C.text,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: -0.5,
                marginTop: 6,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {jpy(ytdRevenue)}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <span style={{ color: C.green, fontSize: 12, fontWeight: 600 }}>
                +{jpy(Math.floor(ytdRevenue * 0.184))} (+18.4%)
              </span>
              <span style={{ color: C.textVeryDim, fontSize: 12 }}>vs 前30日</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["1日", "7日", "1ヶ月", "3ヶ月", "1年", "今月", "今年"].map((p) => (
              <div
                key={p}
                style={{
                  padding: "5px 10px",
                  background: p === "1ヶ月" ? "#f0f1f5" : "transparent",
                  color: C.text,
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 4,
                }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>

        <svg width={gw} height={gh + 30} style={{ marginTop: 14, display: "block" }}>
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <line key={i} x1={0} y1={t * gh} x2={gw} y2={t * gh} stroke={C.gridLine} strokeWidth={1} />
          ))}
          <defs>
            <linearGradient id="revFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={C.accent} stopOpacity={0.22} />
              <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={fillD} fill="url(#revFill)" />
          <path d={pathD} stroke={C.accent} strokeWidth={2.2} fill="none" />
          {(() => {
            const last = series[series.length - 1];
            const x = (last.x / 29) * gw;
            const y = gh - ((last.y - minY) / (maxY - minY)) * gh;
            return (
              <>
                <circle cx={x} cy={y} r={9} fill={C.accent} opacity={0.18} />
                <circle cx={x} cy={y} r={4.5} fill={C.accent} />
                <circle cx={x} cy={y} r={2} fill="#fff" />
              </>
            );
          })()}
          {[0, 7, 14, 21, 29].map((i, idx) => {
            const x = (i / 29) * gw;
            const days = ["4/17", "4/24", "5/1", "5/8", "5/16"];
            return (
              <text key={i} x={x} y={gh + 20} fill={C.textMuted} fontSize={11} textAnchor="middle" fontFamily="system-ui">
                {days[idx]}
              </text>
            );
          })}
        </svg>
      </div>

      {/* ====== 右: 最近の入金リスト ====== */}
      <div
        style={{
          position: "absolute",
          top: 270,
          left: 872,
          right: 36,
          height: 380,
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 20,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>最近の入金</div>
          <span style={{ color: C.textVeryDim, fontSize: 12 }}>すべて表示 →</span>
        </div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
          {recentRows.map((t, i) => {
            const m = SOURCE_META[t.source];
            const isRefund = t.amount < 0;
            const opacity = i === 0 ? interpolate(frame - t.at, [0, 6], [0, 1], { extrapolateRight: "clamp" }) : 1;
            const offsetY = i === 0 ? interpolate(frame - t.at, [0, 6], [-6, 0], { extrapolateRight: "clamp" }) : 0;
            return (
              <div
                key={t.at}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 2px",
                  borderBottom: i < recentRows.length - 1 ? `1px solid ${C.gridLine}` : "none",
                  opacity,
                  transform: `translateY(${offsetY}px)`,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: m.bg,
                    color: m.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    marginRight: 10,
                    flexShrink: 0,
                  }}
                >
                  {m.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: C.text,
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.label === "note" || m.label === "Brain" || m.label === "BASE" || m.label === "Kindle" || m.label === "Udemy"
                      ? `${m.label}『${t.title}』`
                      : t.title}
                  </div>
                  <div style={{ color: C.textMuted, fontSize: 11, marginTop: 1 }}>
                    {m.tag} · {t.buyer}
                  </div>
                </div>
                <div
                  style={{
                    color: isRefund ? C.red : C.text,
                    fontSize: 14,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    marginLeft: 8,
                  }}
                >
                  {jpySigned(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====== 下: ソース別集計 ====== */}
      <div
        style={{
          position: "absolute",
          top: 668,
          left: 36,
          right: 36,
          bottom: 28,
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "16px 20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>ソース別 · 今日</div>
          <div style={{ display: "flex", gap: 10, color: C.textMuted, fontSize: 12 }}>
            <span>絞り込み</span>
            <span>CSVダウンロード</span>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 14,
            marginTop: 16,
          }}
        >
          {(() => {
            // ソース別集計
            const groups = TOASTS.filter((t) => frame >= t.at).reduce((acc, t) => {
              if (!acc[t.source]) acc[t.source] = { count: 0, total: 0 };
              acc[t.source].count += 1;
              acc[t.source].total += t.amount;
              return acc;
            }, {} as Record<string, { count: number; total: number }>);

            const ranked: { src: Source; count: number; total: number }[] = (
              ["sponsor", "brain", "stripe", "note", "udemy", "membership", "aff", "base", "kindle", "tip", "refund"] as Source[]
            )
              .filter((s) => groups[s])
              .map((s) => ({ src: s, ...groups[s] }))
              .slice(0, 6);

            return ranked.map((g) => {
              const m = SOURCE_META[g.src];
              return (
                <div
                  key={g.src}
                  style={{
                    border: `1px solid ${C.gridLine}`,
                    borderRadius: 6,
                    padding: 12,
                    background: "#fff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        background: m.bg,
                        color: m.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {m.icon}
                    </div>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{m.label}</span>
                  </div>
                  <div
                    style={{
                      color: g.total < 0 ? C.red : C.text,
                      fontSize: 18,
                      fontWeight: 700,
                      marginTop: 8,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {g.total < 0 ? `-¥${fmt(-g.total)}` : `¥${fmt(g.total)}`}
                  </div>
                  <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{g.count}件</div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* ====== 通知 (右上) ====== */}
      <div
        style={{
          position: "absolute",
          top: 76,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 100,
        }}
      >
        {liveToasts.map((t) => {
          const m = SOURCE_META[t.source];
          const age = frame - t.at;
          const op = interpolate(age, [0, 4, 32, 40], [0, 1, 1, 0], { extrapolateRight: "clamp" });
          const ty = interpolate(age, [0, 4], [-10, 0], { extrapolateRight: "clamp" });
          const isRefund = t.amount < 0;
          const isBig = t.amount >= 20000;
          return (
            <div
              key={t.at}
              style={{
                opacity: op,
                transform: `translateY(${ty}px)`,
                background: "#fff",
                border: `1px solid ${C.borderStrong}`,
                borderLeft: `3px solid ${isRefund ? C.red : m.color}`,
                borderRadius: 6,
                padding: "10px 14px",
                width: 340,
                boxShadow: isBig
                  ? `0 8px 24px ${m.color}33, 0 1px 3px rgba(10,37,64,0.1)`
                  : "0 4px 16px rgba(10, 37, 64, 0.08)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: isRefund ? C.redLight : m.bg,
                  color: isRefund ? C.red : m.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {isRefund ? "↩" : m.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: C.text,
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {isRefund
                    ? `返金: ${m.label} 『${t.title.replace(/^.*?·\s*/, "")}』`
                    : t.source === "note" || t.source === "brain" || t.source === "base" || t.source === "kindle" || t.source === "udemy"
                    ? `${m.label}『${t.title}』が購入されました`
                    : t.source === "membership"
                    ? `${t.title} 加入`
                    : t.source === "stripe"
                    ? `${t.title} 開始`
                    : t.source === "tip"
                    ? t.title
                    : t.source === "sponsor"
                    ? `スポンサー · ${t.title}`
                    : `${m.label} · ${t.title}`}
                </div>
                <div
                  style={{
                    color: C.textMuted,
                    fontSize: 11,
                    marginTop: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.buyer}
                </div>
              </div>
              <div
                style={{
                  color: isRefund ? C.red : isBig ? m.color : C.text,
                  fontSize: isBig ? 16 : 14,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {jpySigned(t.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
