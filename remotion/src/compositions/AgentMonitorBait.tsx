import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

// ============================================================
// AgentMonitorBait
// btop風のリアルタイムエージェント実行モニタ (情報密度MAX版)
// グラフ8本 + プロセステーブル18個 + ライブログ + キュー/quota
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
  greenDim: "#1f5a2c",
  yellow: "#d29922",
  red: "#f85149",
  blue: "#58a6ff",
  purple: "#a371f7",
  cyan: "#39d0d8",
  orange: "#f0883e",
  pink: "#db6d9b",
};

// ===== グラフ用ノイジーな時系列生成 =====
const series = (seed: number, frame: number, base: number, amp: number, trend: number, range = 100) => {
  const arr: number[] = [];
  for (let i = 0; i < 80; i++) {
    const t = (frame - 80 + i + 80) * 0.13 + seed;
    const v =
      base +
      Math.sin(t * 1.7) * amp * 0.6 +
      Math.cos(t * 0.9) * amp * 0.3 +
      Math.sin(t * 0.3) * amp * 0.2 +
      Math.sin(t * 2.6) * amp * 0.1 +
      (i / 80) * trend;
    arr.push(Math.max(0, Math.min(range, v)));
  }
  return arr;
};

// ===== エージェント定義 (18個) =====
type AgentRow = {
  pid: string;
  user: string;
  name: string;
  command: string;
  cpu: (frame: number) => number;
  mem: (frame: number) => number;
  tokens: (frame: number) => number;
  latency: (frame: number) => number;
  status: (frame: number) => "running" | "stalled" | "ok" | "error" | "queued";
};

const AGENTS: AgentRow[] = [
  { pid: "48211", user: "claude", name: "orchestrator",   command: "claude-code orchestrate --parallel 18",        cpu: (f) => 22 + Math.sin(f * 0.18 + 0) * 6,  mem: (f) => 412 + Math.sin(f * 0.04) * 24, tokens: (f) => 12480 + f * 47, latency: (f) => 14 + Math.sin(f * 0.22) * 4,   status: () => "running" },
  { pid: "48212", user: "claude", name: "x-poster",       command: "claude-x-poster --queue main",                  cpu: (f) => 38 + Math.sin(f * 0.22 + 1) * 14, mem: (f) => 312 + Math.sin(f * 0.05) * 16, tokens: (f) => 8472 + f * 32,  latency: (f) => 124 + Math.sin(f * 0.18) * 28, status: (f) => (f % 60 < 5 ? "ok" : "running") },
  { pid: "48213", user: "claude", name: "threads-poster", command: "claude-threads-poster",                         cpu: (f) => 41 + Math.sin(f * 0.19 + 2) * 12, mem: (f) => 287 + Math.sin(f * 0.06) * 12, tokens: (f) => 6248 + f * 28,  latency: (f) => 187 + Math.sin(f * 0.14) * 32, status: () => "running" },
  { pid: "48214", user: "claude", name: "note-rag",       command: "claude-note-rag --top-k 5",                     cpu: (f) => 54 + Math.sin(f * 0.16 + 3) * 18, mem: (f) => 624 + Math.sin(f * 0.03) * 32, tokens: (f) => 4287 + f * 18,  latency: (f) => 412 + Math.sin(f * 0.11) * 78, status: () => "running" },
  { pid: "48215", user: "claude", name: "ig-image",       command: "claude-ig-image --gemini imagen",               cpu: (f) => 78 + Math.sin(f * 0.13 + 4) * 14, mem: (f) => 1247 + Math.sin(f * 0.04) * 84,tokens: (f) => 824 + f * 4,    latency: (f) => 1820 + Math.sin(f * 0.08) * 240, status: () => "running" },
  { pid: "48216", user: "claude", name: "tiktok-caption", command: "claude-tiktok --whisper large-v3",              cpu: (f) => 32 + Math.sin(f * 0.15 + 5) * 8,  mem: (f) => 487 + Math.sin(f * 0.07) * 22, tokens: (f) => 3247 + f * 14,  latency: (f) => 247 + Math.sin(f * 0.17) * 44, status: () => "running" },
  { pid: "48217", user: "claude", name: "slack-reporter", command: "claude-slack --channel growth",                 cpu: (f) => 12 + Math.sin(f * 0.21 + 6) * 4,  mem: (f) => 142 + Math.sin(f * 0.05) * 8,  tokens: (f) => 1247 + f * 7,   latency: (f) => 84 + Math.sin(f * 0.24) * 12,  status: () => "running" },
  { pid: "48218", user: "claude", name: "auto-reply",     command: "claude-auto-reply --filter 0.6",                cpu: (f) => 28 + Math.sin(f * 0.17 + 7) * 9,  mem: (f) => 247 + Math.sin(f * 0.06) * 14, tokens: (f) => 5872 + f * 26,  latency: (f) => 247 + Math.sin(f * 0.15) * 38, status: () => "running" },
  { pid: "48219", user: "claude", name: "dm-engage",      command: "claude-dm --segment 412",                       cpu: (f) => 18 + Math.sin(f * 0.23 + 8) * 7,  mem: (f) => 178 + Math.sin(f * 0.08) * 9,  tokens: (f) => 2841 + f * 12,  latency: (f) => 312 + Math.sin(f * 0.12) * 58, status: (f) => (f > 280 && f < 330 ? "stalled" : "running") },
  { pid: "48220", user: "claude", name: "trend-scanner",  command: "claude-trend --window 24h",                     cpu: (f) => 8 + Math.sin(f * 0.28 + 9) * 3,   mem: (f) => 87 + Math.sin(f * 0.1) * 5,    tokens: (f) => 947 + f * 3,    latency: (f) => 47 + Math.sin(f * 0.3) * 8,    status: () => "running" },
  { pid: "48221", user: "claude", name: "safety-filter",  command: "claude-safety --blocklist v3",                  cpu: (f) => 6 + Math.sin(f * 0.32 + 10) * 2,  mem: (f) => 64 + Math.sin(f * 0.12) * 3,   tokens: (f) => 0,              latency: (f) => 3 + Math.sin(f * 0.4) * 1,     status: () => "running" },
  { pid: "48222", user: "claude", name: "metrics-aggr",   command: "claude-metrics --interval 60s",                 cpu: (f) => 14 + Math.sin(f * 0.19 + 11) * 5, mem: (f) => 124 + Math.sin(f * 0.09) * 8,  tokens: (f) => 487 + f * 2,    latency: (f) => 28 + Math.sin(f * 0.26) * 6,   status: () => "running" },
  { pid: "48223", user: "claude", name: "youtube-shorts", command: "claude-yt-shorts --queue main",                 cpu: (f) => 62 + Math.sin(f * 0.14 + 12) * 14,mem: (f) => 892 + Math.sin(f * 0.05) * 42, tokens: (f) => 2147 + f * 9,   latency: (f) => 947 + Math.sin(f * 0.1) * 184, status: () => "running" },
  { pid: "48224", user: "claude", name: "linkedin-trans", command: "claude-linkedin --en",                          cpu: (f) => 22 + Math.sin(f * 0.2 + 13) * 6,  mem: (f) => 184 + Math.sin(f * 0.08) * 11, tokens: (f) => 1847 + f * 8,   latency: (f) => 187 + Math.sin(f * 0.16) * 24, status: () => "running" },
  { pid: "48225", user: "claude", name: "mention-watch",  command: "claude-watch --filter mentions",                cpu: (f) => 4 + Math.sin(f * 0.36 + 14) * 2,  mem: (f) => 47 + Math.sin(f * 0.14) * 2,   tokens: (f) => 184 + f * 1,    latency: (f) => 24 + Math.sin(f * 0.32) * 4,   status: () => "running" },
  { pid: "48226", user: "claude", name: "embedding-gen",  command: "claude-embed --model text-3",                   cpu: (f) => 47 + Math.sin(f * 0.17 + 15) * 11,mem: (f) => 1847 + Math.sin(f * 0.03) * 124,tokens: (f) => 8472 + f * 38,  latency: (f) => 412 + Math.sin(f * 0.13) * 68, status: () => "running" },
  { pid: "48227", user: "claude", name: "image-classify", command: "claude-classify --model gemini",                cpu: (f) => 58 + Math.sin(f * 0.12 + 16) * 13,mem: (f) => 1247 + Math.sin(f * 0.04) * 87, tokens: (f) => 624 + f * 3,    latency: (f) => 847 + Math.sin(f * 0.09) * 124,status: () => "running" },
  { pid: "48228", user: "claude", name: "cron-runner",    command: "claude-cron --schedule 30m",                    cpu: (f) => 3 + Math.sin(f * 0.4 + 17) * 1,   mem: (f) => 28 + Math.sin(f * 0.16) * 2,   tokens: (f) => 0,              latency: (f) => 2 + Math.sin(f * 0.5) * 1,     status: () => "running" },
];

// ===== ライブログ用テンプレ =====
const LOG_TEMPLATES = [
  { color: "#7d8590", template: "[orchestrator] dispatching job to {agent}" },
  { color: "#3fb950", template: "[{agent}] ✓ POST /2/tweets 201 {ms}ms" },
  { color: "#3fb950", template: "[{agent}] ✓ POST /v1/posts 201 {ms}ms id=t_{id}" },
  { color: "#3fb950", template: "[{agent}] ✓ generated 142 tokens in {ms}ms" },
  { color: "#58a6ff", template: "[{agent}] fetching trends · window=24h limit=20" },
  { color: "#58a6ff", template: "[{agent}] embedding query · dims=1536" },
  { color: "#58a6ff", template: "[{agent}] pgvector match · k=5 cosine=0.{cos}" },
  { color: "#58a6ff", template: "[{agent}] retrieving {n} sources from knowledge base" },
  { color: "#d29922", template: "[{agent}] rate limit approaching · used={u}/50" },
  { color: "#d29922", template: "[{agent}] retry in 300ms (backoff)" },
  { color: "#7d8590", template: "[{agent}] cache hit · {hits}/{total}" },
  { color: "#7d8590", template: "[{agent}] flushed {n} records to supabase" },
  { color: "#a371f7", template: "[{agent}] usage: {tok} tokens · $0.0{cost}" },
  { color: "#a371f7", template: "[{agent}] claude-opus-4-5 stream chunk {n}" },
  { color: "#3fb950", template: "[{agent}] ✓ persisted to db · row_id={id}" },
  { color: "#3fb950", template: "[{agent}] ✓ image saved · {w}x{h} png" },
  { color: "#7d8590", template: "[{agent}] heartbeat ping → orchestrator" },
  { color: "#39d0d8", template: "[{agent}] websocket connected · {clients} clients" },
];

const AGENT_NAMES = AGENTS.map((a) => a.name);
const pickAgent = (seed: number) => AGENT_NAMES[seed % AGENT_NAMES.length];
const rand = (seed: number, max: number) => Math.floor((Math.sin(seed * 12.9898) * 43758.5453) % max + max) % max;

// 各ログのタイムスタンプを生成
type LogLine = { at: number; color: string; text: string };
const buildLogs = (): LogLine[] => {
  const logs: LogLine[] = [];
  for (let i = 0; i < 120; i++) {
    const at = i * 4 + rand(i, 3);  // 約 0.13秒ごと
    const tpl = LOG_TEMPLATES[rand(i + 7, LOG_TEMPLATES.length)];
    const text = tpl.template
      .replace("{agent}", pickAgent(rand(i + 1, 100)))
      .replace("{ms}", String(40 + rand(i + 2, 800)))
      .replace("{id}", Math.random().toString(36).slice(2, 8))
      .replace("{cos}", String(70 + rand(i + 3, 28)))
      .replace("{n}", String(rand(i + 4, 200) + 5))
      .replace("{u}", String(rand(i + 5, 48)))
      .replace("{hits}", String(rand(i + 6, 80) + 20))
      .replace("{total}", "100")
      .replace("{tok}", String(rand(i + 7, 4000) + 100))
      .replace("{cost}", String(rand(i + 8, 99)).padStart(2, "0"))
      .replace("{w}", "1024")
      .replace("{h}", "1024")
      .replace("{clients}", String(rand(i + 9, 12) + 4));
    logs.push({ at, color: tpl.color, text });
  }
  return logs;
};
const ALL_LOGS = buildLogs();

// ===== グラフコンポーネント =====
const MiniChart: React.FC<{
  title: string;
  value: string;
  color: string;
  data: number[];
  width: number;
  height: number;
}> = ({ title, value, color, data, width, height }) => {
  const gw = width - 16;
  const gh = height - 50;
  const pathD = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * gw;
      const y = gh - (v / 100) * gh;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const fillD = `${pathD} L${gw},${gh} L0,${gh} Z`;

  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 4,
        padding: "6px 10px",
        width,
        height,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <span
          style={{
            color: C.textMuted,
            fontSize: 9,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {title}
        </span>
        <span
          style={{
            color,
            fontSize: 13,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {value}
        </span>
      </div>
      <svg width={gw} height={gh + 4} style={{ display: "block" }}>
        <defs>
          <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0.33, 0.66].map((t) => (
          <line key={t} x1={0} y1={t * gh} x2={gw} y2={t * gh} stroke={C.border} strokeWidth={1} strokeDasharray="2 4" />
        ))}
        <path d={fillD} fill={`url(#grad-${title})`} />
        <path d={pathD} stroke={color} strokeWidth={1.3} fill="none" />
      </svg>
    </div>
  );
};

const fmt = (n: number) => Math.floor(n).toLocaleString("en-US");
const round = (n: number, d = 0) => n.toFixed(d);

export const AgentMonitorBait: React.FC = () => {
  const frame = useCurrentFrame();

  // 各メトリクス (8本)
  const cpuData    = series(0, frame, 42, 28, 8);
  const gpuData    = series(1.2, frame, 68, 22, 4);
  const memData    = series(2.5, frame, 54, 14, 2);
  const tokenData  = series(3.8, frame, 38, 36, 12);
  const netInData  = series(4.1, frame, 32, 24, 18);
  const netOutData = series(5.7, frame, 28, 20, 14);
  const reqData    = series(6.4, frame, 47, 32, 8);
  const errData    = series(7.9, frame, 8, 6, 2, 30);

  const cpuNow    = cpuData[cpuData.length - 1];
  const gpuNow    = gpuData[gpuData.length - 1];
  const memNow    = memData[memData.length - 1];
  const tokenNow  = tokenData[tokenData.length - 1];
  const netInNow  = netInData[netInData.length - 1];
  const netOutNow = netOutData[netOutData.length - 1];
  const reqNow    = reqData[reqData.length - 1];
  const errNow    = errData[errData.length - 1];

  // 合計
  const totalTokens = AGENTS.reduce((sum, a) => sum + a.tokens(frame), 0);
  const totalCpu = AGENTS.reduce((sum, a) => sum + a.cpu(frame), 0);
  const totalMem = AGENTS.reduce((sum, a) => sum + a.mem(frame), 0);
  const avgLatency = AGENTS.reduce((sum, a) => sum + a.latency(frame), 0) / AGENTS.length;
  const runningCount = AGENTS.length;

  // タイマー
  const sec = Math.floor(frame / 30) + 1247;
  const hh = Math.floor(sec / 3600).toString().padStart(2, "0");
  const mm = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const ss = (sec % 60).toString().padStart(2, "0");

  // ライブログ (最新15行)
  const visibleLogs = ALL_LOGS.filter((l) => frame >= l.at).slice(-15);

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace" }}>
      {/* ====== タイトルバー (Windows Terminal風) ====== */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 32,
          background: "#0c0c0c",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", color: C.text, fontSize: 12, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
          <span style={{ color: C.green, fontWeight: 700 }}>▣</span>
          <span style={{ fontWeight: 500 }}>Windows Terminal — claude-orchestrator</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", paddingLeft: 12, gap: 2 }}>
          {[
            { name: "btop · agents", active: true },
            { name: "logs", active: false },
            { name: "redis-cli", active: false },
            { name: "pg-stat", active: false },
          ].map((t) => (
            <div
              key={t.name}
              style={{
                padding: "5px 12px 7px",
                background: t.active ? C.panel : "transparent",
                borderTop: t.active ? `2px solid ${C.green}` : "2px solid transparent",
                color: t.active ? C.text : C.textVeryDim,
                fontSize: 11,
                fontFamily: "'Segoe UI', sans-serif",
              }}
            >
              ⌬ {t.name}
            </div>
          ))}
          <div style={{ padding: "5px 8px", color: C.textVeryDim, fontSize: 14, alignSelf: "center" }}>+</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "stretch" }}>
          <div style={{ width: 46, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 12 }}>─</div>
          <div style={{ width: 46, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 10 }}>▢</div>
          <div style={{ width: 46, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 11 }}>✕</div>
        </div>
      </div>

      {/* ====== btop ステータスライン ====== */}
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 0,
          right: 0,
          height: 24,
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 18,
          color: C.textMuted,
          fontSize: 10,
        }}
      >
        <span style={{ color: C.text, fontWeight: 600 }}>btop · v1.4.0</span>
        <span><span style={{ color: C.textVeryDim }}>uptime </span>{hh}:{mm}:{ss}</span>
        <span><span style={{ color: C.textVeryDim }}>load </span>4.21, 4.18, 3.94</span>
        <span><span style={{ color: C.textVeryDim }}>tasks </span>{runningCount} <span style={{ color: C.green }}>● running</span> 0 <span style={{ color: C.yellow }}>● sleeping</span></span>
        <span><span style={{ color: C.textVeryDim }}>kernel </span>linux-6.8.0-claude</span>
        <span><span style={{ color: C.textVeryDim }}>region </span>asia-northeast1</span>
        <span><span style={{ color: C.textVeryDim }}>node </span>worker-04 / 12</span>
        <span style={{ marginLeft: "auto", color: C.green }}>● {runningCount}/{runningCount} agents · 0 errors · 12.4s avg cycle</span>
      </div>

      {/* ====== グラフ8本 (4列×2行) ====== */}
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 14,
          right: 320,
          height: 196,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(2, 1fr)",
          gap: 8,
        }}
      >
        <MiniChart title="cpu · %"           value={`${round(cpuNow, 1)}%`}                    color={C.green}  data={cpuData}    width={340} height={94} />
        <MiniChart title="gpu · %"           value={`${round(gpuNow, 1)}%`}                    color={C.purple} data={gpuData}    width={340} height={94} />
        <MiniChart title="mem · gb"          value={`${round(memNow * 0.18, 2)} / 16.0`}       color={C.cyan}   data={memData}    width={340} height={94} />
        <MiniChart title="tokens · k/s"      value={`${round(tokenNow * 1.4, 1)}k`}            color={C.yellow} data={tokenData}  width={340} height={94} />
        <MiniChart title="net in · mb/s"     value={`${round(netInNow * 0.42, 1)}`}            color={C.blue}   data={netInData}  width={340} height={94} />
        <MiniChart title="net out · mb/s"    value={`${round(netOutNow * 0.38, 1)}`}           color={C.pink}   data={netOutData} width={340} height={94} />
        <MiniChart title="requests · /s"     value={`${round(reqNow * 12.4)}`}                 color={C.orange} data={reqData}    width={340} height={94} />
        <MiniChart title="errors · /min"     value={`${round(errNow * 0.4, 1)}`}               color={C.red}    data={errData}    width={340} height={94} />
      </div>

      {/* ====== サマリ帯 ====== */}
      <div
        style={{
          position: "absolute",
          top: 270,
          left: 14,
          right: 320,
          height: 28,
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 20,
          color: C.textMuted,
          fontSize: 10,
        }}
      >
        <span><span style={{ color: C.textVeryDim }}>procs </span><span style={{ color: C.text }}>{AGENTS.length}</span></span>
        <span><span style={{ color: C.textVeryDim }}>active </span><span style={{ color: C.green }}>{runningCount}</span></span>
        <span><span style={{ color: C.textVeryDim }}>tokens </span><span style={{ color: C.text }}>{fmt(totalTokens)}</span></span>
        <span><span style={{ color: C.textVeryDim }}>cpu·sum </span><span style={{ color: C.text }}>{round(totalCpu, 1)}%</span></span>
        <span><span style={{ color: C.textVeryDim }}>mem·sum </span><span style={{ color: C.text }}>{(totalMem / 1024).toFixed(2)}GB</span></span>
        <span><span style={{ color: C.textVeryDim }}>avg lat </span><span style={{ color: C.text }}>{round(avgLatency)}ms</span></span>
        <span><span style={{ color: C.textVeryDim }}>queue </span><span style={{ color: C.text }}>{47 + Math.floor(frame * 0.1) % 14}</span></span>
        <span><span style={{ color: C.textVeryDim }}>redis </span><span style={{ color: C.green }}>● connected</span></span>
        <span><span style={{ color: C.textVeryDim }}>pg </span><span style={{ color: C.green }}>● 12/100</span></span>
        <span style={{ marginLeft: "auto", color: C.textVeryDim }}>cost · $0.{(40 + Math.floor(frame / 60))}/h</span>
      </div>

      {/* ====== プロセステーブル ====== */}
      <div
        style={{
          position: "absolute",
          top: 306,
          left: 14,
          right: 320,
          bottom: 14,
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "50px 60px 130px 1fr 56px 64px 76px 70px 90px",
            gap: 10,
            padding: "8px 14px",
            background: "#10151b",
            borderBottom: `1px solid ${C.border}`,
            color: C.textVeryDim,
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            fontWeight: 600,
          }}
        >
          <span>PID</span>
          <span>USER</span>
          <span>NAME</span>
          <span>COMMAND</span>
          <span style={{ textAlign: "right" }}>CPU%</span>
          <span style={{ textAlign: "right" }}>MEM MB</span>
          <span style={{ textAlign: "right" }}>TOKENS</span>
          <span style={{ textAlign: "right" }}>LAT ms</span>
          <span>STATUS</span>
        </div>

        <div style={{ padding: "2px 0", overflow: "hidden" }}>
          {AGENTS.map((agent, i) => {
            const cpu = agent.cpu(frame);
            const mem = agent.mem(frame);
            const tokens = agent.tokens(frame);
            const latency = agent.latency(frame);
            const status = agent.status(frame);

            const cpuColor = cpu > 70 ? C.red : cpu > 40 ? C.yellow : C.text;
            const latColor = latency > 1000 ? C.yellow : C.text;

            const statusConf: Record<string, { color: string; label: string }> = {
              running: { color: C.green,  label: "● running" },
              ok:      { color: C.green,  label: "✓ ok" },
              stalled: { color: C.yellow, label: "● stalled" },
              error:   { color: C.red,    label: "✕ error" },
              queued:  { color: C.textMuted, label: "○ queued" },
            };
            const sConf = statusConf[status];
            const blink = (status === "stalled" || status === "error") ? Math.sin(frame * 0.4) > 0 : true;

            return (
              <div
                key={agent.pid}
                style={{
                  display: "grid",
                  gridTemplateColumns: "50px 60px 130px 1fr 56px 64px 76px 70px 90px",
                  gap: 10,
                  padding: "5px 14px",
                  borderBottom: i < AGENTS.length - 1 ? `1px solid ${C.border}33` : "none",
                  color: C.text,
                  fontSize: 11,
                  alignItems: "center",
                }}
              >
                <span style={{ color: C.textVeryDim }}>{agent.pid}</span>
                <span style={{ color: C.textMuted }}>{agent.user}</span>
                <span style={{ color: C.cyan }}>{agent.name}</span>
                <span style={{ color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.command}</span>
                <span style={{ color: cpuColor, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{round(cpu, 1)}</span>
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: C.textMuted }}>{round(mem)}</span>
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(tokens)}</span>
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: latColor }}>{round(latency)}</span>
                <span style={{ color: sConf.color, opacity: blink ? 1 : 0.4 }}>{sConf.label}</span>
              </div>
            );
          })}
        </div>

        {/* フッタ */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "6px 14px",
            background: "#10151b",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            color: C.textVeryDim,
            fontSize: 10,
          }}
        >
          <span>F1 help · F2 setup · F3 search · F5 refresh · F9 kill · F10 quit</span>
          <span style={{ color: C.green }}>● tail -f /var/log/claude-orchestrator.log</span>
        </div>
      </div>

      {/* ====== 右: ライブログ + APIクォータ + キュー ====== */}
      <div
        style={{
          position: "absolute",
          top: 64,
          right: 14,
          width: 300,
          bottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* ライブログ */}
        <div
          style={{
            flex: 1,
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              background: "#10151b",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 10,
              color: C.textMuted,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            <span>● live log · all agents</span>
            <span style={{ color: C.green }}>{ALL_LOGS.filter((l) => frame >= l.at).length} lines</span>
          </div>
          <div
            style={{
              flex: 1,
              padding: "6px 12px",
              fontSize: 10,
              lineHeight: 1.45,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column-reverse",
              color: C.text,
            }}
          >
            <div>
              {visibleLogs.map((l, i) => {
                const ts = (() => {
                  const t = (l.at / 30 + 1248) | 0;
                  const h = Math.floor(t / 3600).toString().padStart(2, "0");
                  const m = Math.floor((t % 3600) / 60).toString().padStart(2, "0");
                  const s = (t % 60).toString().padStart(2, "0");
                  return `${h}:${m}:${s}`;
                })();
                return (
                  <div key={`${l.at}-${i}`} style={{ display: "flex", gap: 6, marginBottom: 1 }}>
                    <span style={{ color: C.textVeryDim, flexShrink: 0 }}>{ts}</span>
                    <span style={{ color: l.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* APIクォータ */}
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            padding: "8px 12px",
          }}
        >
          <div style={{ color: C.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
            API quota · 24h
          </div>
          {[
            { label: "anthropic", used: 38247 + Math.floor(frame * 4), total: 100000, color: C.orange },
            { label: "openai",    used: 12480 + Math.floor(frame * 2), total: 50000,  color: C.green },
            { label: "twitter",   used: 47 + Math.floor(frame * 0.04), total: 300,    color: C.blue },
            { label: "gemini",    used: 824 + Math.floor(frame * 0.3), total: 1500,   color: C.purple },
          ].map((q) => {
            const ratio = Math.min(1, q.used / q.total);
            return (
              <div key={q.label} style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted }}>
                  <span>{q.label}</span>
                  <span style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>
                    {fmt(q.used)} / {fmt(q.total)}
                  </span>
                </div>
                <div style={{ height: 3, background: "#1a1f27", borderRadius: 1, overflow: "hidden", marginTop: 2 }}>
                  <div style={{ height: "100%", width: `${ratio * 100}%`, background: ratio > 0.8 ? C.red : q.color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* キュー / Redis */}
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            padding: "8px 12px",
            fontSize: 10,
            color: C.textMuted,
          }}
        >
          <div style={{ color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
            Queues · redis
          </div>
          {[
            { name: "x-post",       depth: 12 + Math.floor(frame * 0.05) % 8, lag: "84ms" },
            { name: "threads-post", depth: 8  + Math.floor(frame * 0.04) % 5, lag: "112ms" },
            { name: "note-rag",     depth: 4  + Math.floor(frame * 0.03) % 3, lag: "287ms" },
            { name: "ig-image",     depth: 3  + Math.floor(frame * 0.02) % 2, lag: "1.2s" },
            { name: "tiktok-cap",   depth: 6  + Math.floor(frame * 0.03) % 4, lag: "412ms" },
            { name: "dm-engage",    depth: 24 + Math.floor(frame * 0.06) % 12,lag: "187ms" },
          ].map((q) => (
            <div key={q.name} style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
              <span><span style={{ color: C.cyan }}>{q.name}</span></span>
              <span>
                <span style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>{q.depth}</span>
                <span style={{ color: C.textVeryDim }}> · {q.lag}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
