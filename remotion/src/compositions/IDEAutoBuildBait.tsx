import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

// ============================================================
// IDEAutoBuildBait
// Cursor風のIDEで、ユーザーが1行指示するとAIが自動で
// ファイル生成 → コード書き → npm install → test → deploy
// まで全部やる動画。本物っぽさに振った無機質UIで作る。
// 1920×1080、30fps、24秒 (720 frames)
// ============================================================

// ===== VSCode/Cursor Dark+ パレット =====
const C = {
  bg: "#1e1e1e",
  sidebar: "#181818",
  activity: "#181818",
  tabsBar: "#181818",
  tabActive: "#1e1e1e",
  tabInactive: "#2d2d30",
  panel: "#181818",
  border: "#252526",
  text: "#cccccc",
  textDim: "#858585",
  textVeryDim: "#5a5a5a",
  cursor: "#aeafad",
  // syntax
  comment: "#6a9955",
  keyword: "#569cd6",
  string: "#ce9178",
  fn: "#dcdcaa",
  num: "#b5cea8",
  type: "#4ec9b0",
  variable: "#9cdcfe",
  paren: "#ffd700",
  // semantic
  green: "#4ec9b0",
  red: "#f48771",
  yellow: "#dcdcaa",
  blue: "#569cd6",
};

// ===== ファイルツリー定義 =====
type FileEntry = {
  path: string;
  appearAt: number;
  isDir?: boolean;
  depth: number;
  icon?: string;
};

const FILES: FileEntry[] = [
  { path: ".env.example",            appearAt: 60,  depth: 0, icon: "env" },
  { path: ".gitignore",              appearAt: 63,  depth: 0, icon: "git" },
  { path: "package.json",            appearAt: 66,  depth: 0, icon: "json" },
  { path: "pnpm-lock.yaml",          appearAt: 69,  depth: 0, icon: "yaml" },
  { path: "tsconfig.json",           appearAt: 72,  depth: 0, icon: "json" },
  { path: "vercel.json",             appearAt: 75,  depth: 0, icon: "json" },
  { path: "src",                     appearAt: 78,  depth: 0, isDir: true },
  { path: "src/index.ts",            appearAt: 81,  depth: 1, icon: "ts" },
  { path: "src/lib",                 appearAt: 84,  depth: 1, isDir: true },
  { path: "src/lib/claude.ts",       appearAt: 87,  depth: 2, icon: "ts" },
  { path: "src/lib/x.ts",            appearAt: 90,  depth: 2, icon: "ts" },
  { path: "src/lib/db.ts",           appearAt: 93,  depth: 2, icon: "ts" },
  { path: "src/lib/safety.ts",       appearAt: 96,  depth: 2, icon: "ts" },
  { path: "src/jobs",                appearAt: 99,  depth: 1, isDir: true },
  { path: "src/jobs/run.ts",         appearAt: 102, depth: 2, icon: "ts" },
  { path: "src/jobs/x-post.ts",      appearAt: 105, depth: 2, icon: "ts" },
  { path: "src/jobs/threads-post.ts",appearAt: 108, depth: 2, icon: "ts" },
  { path: "src/jobs/note-post.ts",   appearAt: 111, depth: 2, icon: "ts" },
  { path: "src/types.ts",            appearAt: 114, depth: 1, icon: "ts" },
  { path: "tests",                   appearAt: 117, depth: 0, isDir: true },
  { path: "tests/x-post.test.ts",    appearAt: 120, depth: 1, icon: "ts" },
];

// 短縮トークン構築ヘルパー
const t = (s: string, c: string) => ({ t: s, c });
const T = (s: string) => t(s, C.text);
const K = (s: string) => t(s, C.keyword);
const S = (s: string) => t(s, C.string);
const F = (s: string) => t(s, C.fn);
const V = (s: string) => t(s, C.variable);
const N = (s: string) => t(s, C.num);
const TY = (s: string) => t(s, C.type);
const CM = (s: string) => t(s, C.comment);

// ===== エディタに流すコードシーケンス =====
type CodeStep = {
  fileName: string;
  startFrame: number;
  durationFrames: number;
  lines: { tokens: { t: string; c: string }[] }[];
};

const CODE_STEPS: CodeStep[] = [
  // ───── 1. package.json ─────
  {
    fileName: "package.json",
    startFrame: 130,
    durationFrames: 36,
    lines: [
      { tokens: [T("{")] },
      { tokens: [T("  "), S("\"name\""), T(": "), S("\"x-auto-publisher\""), T(",")] },
      { tokens: [T("  "), S("\"version\""), T(": "), S("\"0.1.0\""), T(",")] },
      { tokens: [T("  "), S("\"private\""), T(": "), K("true"), T(",")] },
      { tokens: [T("  "), S("\"scripts\""), T(": {")] },
      { tokens: [T("    "), S("\"dev\""), T(": "), S("\"tsx src/index.ts\""), T(",")] },
      { tokens: [T("    "), S("\"test\""), T(": "), S("\"vitest run\""), T(",")] },
      { tokens: [T("    "), S("\"deploy\""), T(": "), S("\"vercel --prod\"")] },
      { tokens: [T("  },")] },
      { tokens: [T("  "), S("\"dependencies\""), T(": {")] },
      { tokens: [T("    "), S("\"@anthropic-ai/sdk\""), T(": "), S("\"0.62.0\""), T(",")] },
      { tokens: [T("    "), S("\"twitter-api-v2\""), T(": "), S("\"1.21.4\""), T(",")] },
      { tokens: [T("    "), S("\"@supabase/supabase-js\""), T(": "), S("\"2.46.1\""), T(",")] },
      { tokens: [T("    "), S("\"zod\""), T(": "), S("\"3.23.8\"")] },
      { tokens: [T("  }")] },
      { tokens: [T("}")] },
    ],
  },

  // ───── 2. src/lib/db.ts ─────
  {
    fileName: "src/lib/db.ts",
    startFrame: 172,
    durationFrames: 50,
    lines: [
      { tokens: [K("import"), T(" { "), V("createClient"), T(" } "), K("from"), T(" "), S("\"@supabase/supabase-js\""), T(";")] },
      { tokens: [K("import"), T(" "), K("type"), T(" { "), TY("Trend"), T(", "), TY("Post"), T(" } "), K("from"), T(" "), S("\"../types\""), T(";")] },
      { tokens: [] },
      { tokens: [K("const"), T(" "), V("sb"), T(" = "), F("createClient"), T("(")] },
      { tokens: [T("  "), V("process"), T("."), V("env"), T("."), V("SUPABASE_URL"), T("!,")] },
      { tokens: [T("  "), V("process"), T("."), V("env"), T("."), V("SUPABASE_SERVICE_KEY"), T("!")] },
      { tokens: [T(");")] },
      { tokens: [] },
      { tokens: [K("export"), T(" "), K("const"), T(" "), V("db"), T(" = {")] },
      { tokens: [T("  "), V("trends"), T(": {")] },
      { tokens: [T("    "), K("async"), T(" "), F("topN"), T("("), V("n"), T(": "), TY("number"), T("): "), TY("Promise"), T("<"), TY("Trend"), T("[]> {")] },
      { tokens: [T("      "), K("const"), T(" { "), V("data"), T(" } = "), K("await"), T(" "), V("sb"), T(".")] },
      { tokens: [T("        "), F("from"), T("("), S("\"trends\""), T(")."), F("select"), T("("), S("\"*\""), T(").")] },
      { tokens: [T("        "), F("order"), T("("), S("\"engagement\""), T(", { "), V("ascending"), T(": "), K("false"), T(" }).")] },
      { tokens: [T("        "), F("limit"), T("("), V("n"), T(");")] },
      { tokens: [T("      "), K("return"), T(" "), V("data"), T(" ?? [];")] },
      { tokens: [T("    },")] },
      { tokens: [T("  },")] },
      { tokens: [T("  "), V("posts"), T(": {")] },
      { tokens: [T("    "), K("async"), T(" "), F("insert"), T("("), V("row"), T(": "), TY("Post"), T(") {")] },
      { tokens: [T("      "), K("await"), T(" "), V("sb"), T("."), F("from"), T("("), S("\"posts\""), T(")."), F("insert"), T("("), V("row"), T(");")] },
      { tokens: [T("    },")] },
      { tokens: [T("  },")] },
      { tokens: [T("};")] },
    ],
  },

  // ───── 3. src/lib/x.ts ─────
  {
    fileName: "src/lib/x.ts",
    startFrame: 228,
    durationFrames: 42,
    lines: [
      { tokens: [K("import"), T(" { "), TY("TwitterApi"), T(" } "), K("from"), T(" "), S("\"twitter-api-v2\""), T(";")] },
      { tokens: [] },
      { tokens: [K("const"), T(" "), V("client"), T(" = "), K("new"), T(" "), F("TwitterApi"), T("({")] },
      { tokens: [T("  "), V("appKey"), T(":        "), V("process"), T("."), V("env"), T("."), V("X_API_KEY"), T("!,")] },
      { tokens: [T("  "), V("appSecret"), T(":     "), V("process"), T("."), V("env"), T("."), V("X_API_SECRET"), T("!,")] },
      { tokens: [T("  "), V("accessToken"), T(":   "), V("process"), T("."), V("env"), T("."), V("X_ACCESS_TOKEN"), T("!,")] },
      { tokens: [T("  "), V("accessSecret"), T(":  "), V("process"), T("."), V("env"), T("."), V("X_ACCESS_SECRET"), T("!,")] },
      { tokens: [T("});")] },
      { tokens: [] },
      { tokens: [K("export"), T(" "), K("async"), T(" "), K("function"), T(" "), F("postTweet"), T("("), V("text"), T(": "), TY("string"), T(") {")] },
      { tokens: [T("  "), K("const"), T(" "), V("res"), T(" = "), K("await"), T(" "), V("client"), T("."), V("v2"), T("."), F("tweet"), T("("), V("text"), T(");")] },
      { tokens: [T("  "), K("return"), T(" { "), V("id"), T(": "), V("res"), T("."), V("data"), T("."), V("id"), T(", "), V("text"), T(": "), V("res"), T("."), V("data"), T("."), V("text"), T(" };")] },
      { tokens: [T("}")] },
    ],
  },

  // ───── 4. src/lib/claude.ts ─────
  {
    fileName: "src/lib/claude.ts",
    startFrame: 276,
    durationFrames: 56,
    lines: [
      { tokens: [K("import"), T(" "), TY("Anthropic"), T(" "), K("from"), T(" "), S("\"@anthropic-ai/sdk\""), T(";")] },
      { tokens: [K("import"), T(" "), K("type"), T(" { "), TY("Trend"), T(" } "), K("from"), T(" "), S("\"../types\""), T(";")] },
      { tokens: [] },
      { tokens: [K("const"), T(" "), V("client"), T(" = "), K("new"), T(" "), F("Anthropic"), T("();")] },
      { tokens: [] },
      { tokens: [K("export"), T(" "), K("const"), T(" "), V("anthropic"), T(" = {")] },
      { tokens: [T("  "), K("async"), T(" "), F("draft"), T("({ "), V("trends"), T(" }: { "), V("trends"), T(": "), TY("Trend"), T("[] }) {")] },
      { tokens: [T("    "), K("const"), T(" "), V("r"), T(" = "), K("await"), T(" "), V("client"), T("."), V("messages"), T("."), F("create"), T("({")] },
      { tokens: [T("      "), V("model"), T(":      "), S("\"claude-opus-4-5\""), T(",")] },
      { tokens: [T("      "), V("max_tokens"), T(": "), N("400"), T(",")] },
      { tokens: [T("      "), V("temperature"), T(":"), N("0.7"), T(",")] },
      { tokens: [T("      "), V("system"), T(":     "), F("systemPrompt"), T("(),")] },
      { tokens: [T("      "), V("messages"), T(":   [{ "), V("role"), T(": "), S("\"user\""), T(", "), V("content"), T(": "), F("userPrompt"), T("("), V("trends"), T(") }],")] },
      { tokens: [T("    });")] },
      { tokens: [T("    "), K("const"), T(" "), V("block"), T(" = "), V("r"), T("."), V("content"), T("["), N("0"), T("];")] },
      { tokens: [T("    "), K("if"), T(" ("), V("block"), T("."), V("type"), T(" !== "), S("\"text\""), T(") "), K("throw"), T(" "), K("new"), T(" "), F("Error"), T("("), S("\"empty response\""), T(");")] },
      { tokens: [T("    "), K("return"), T(" { "), V("text"), T(": "), V("block"), T("."), V("text"), T(", "), V("tokens"), T(": "), V("r"), T("."), V("usage"), T(" };")] },
      { tokens: [T("  },")] },
      { tokens: [T("};")] },
      { tokens: [] },
      { tokens: [K("function"), T(" "), F("systemPrompt"), T("() {")] },
      { tokens: [T("  "), K("return"), T(" ["), ] },
      { tokens: [T("    "), S("\"You are a ghostwriter for a Japanese indie hacker.\""), T(",")] },
      { tokens: [T("    "), S("\"Write one punchy native X post. No hashtags, no emoji.\""), T(",")] },
      { tokens: [T("    "), S("\"Max 140 chars. Hook in the first line.\""), T(",")] },
      { tokens: [T("  ]."), F("join"), T("("), S("\" \""), T(");")] },
      { tokens: [T("}")] },
      { tokens: [] },
      { tokens: [K("function"), T(" "), F("userPrompt"), T("("), V("trends"), T(": "), TY("Trend"), T("[]) {")] },
      { tokens: [T("  "), K("return"), T(" "), S("`Draft a viral Japanese post for X based on:\\n${"), V("trends"), S(".map(t => t.tag).join(\", \")}`"), T(";")] },
      { tokens: [T("}")] },
    ],
  },

  // ───── 5. src/lib/safety.ts ─────
  {
    fileName: "src/lib/safety.ts",
    startFrame: 340,
    durationFrames: 36,
    lines: [
      { tokens: [K("import"), T(" { "), V("z"), T(" } "), K("from"), T(" "), S("\"zod\""), T(";")] },
      { tokens: [] },
      { tokens: [K("const"), T(" "), V("blocklist"), T(" = [")] },
      { tokens: [T("  "), V("/email|tel|password|api[\\s-]?key/i"), T(",")] },
      { tokens: [T("  "), V("/[0-9]{3}-[0-9]{4}-[0-9]{4}/"), T(",  "), CM("// 電話番号")] },
      { tokens: [T("  "), V("/[\\w.-]+@[\\w.-]+\\.\\w+/"), T(",     "), CM("// メアド")] },
      { tokens: [T("];")] },
      { tokens: [] },
      { tokens: [K("export"), T(" "), K("async"), T(" "), K("function"), T(" "), F("runSafetyFilter"), T("("), V("text"), T(": "), TY("string"), T(") {")] },
      { tokens: [T("  "), K("const"), T(" "), V("reasons"), T(": "), TY("string"), T("[] = [];")] },
      { tokens: [T("  "), K("for"), T(" ("), K("const"), T(" "), V("rx"), T(" "), K("of"), T(" "), V("blocklist"), T(") {")] },
      { tokens: [T("    "), K("if"), T(" ("), V("rx"), T("."), F("test"), T("("), V("text"), T(")) "), V("reasons"), T("."), F("push"), T("("), V("rx"), T("."), V("source"), T(");")] },
      { tokens: [T("  }")] },
      { tokens: [T("  "), K("return"), T(" { "), V("ok"), T(": "), V("reasons"), T("."), V("length"), T(" === "), N("0"), T(", "), V("reasons"), T(" };")] },
      { tokens: [T("}")] },
    ],
  },

  // ───── 6. src/jobs/x-post.ts ─────
  {
    fileName: "src/jobs/x-post.ts",
    startFrame: 384,
    durationFrames: 60,
    lines: [
      { tokens: [K("import"), T(" { "), V("anthropic"), T(" } "), K("from"), T(" "), S("\"../lib/claude\""), T(";")] },
      { tokens: [K("import"), T(" { "), V("postTweet"), T(" } "), K("from"), T(" "), S("\"../lib/x\""), T(";")] },
      { tokens: [K("import"), T(" { "), V("db"), T(" } "), K("from"), T(" "), S("\"../lib/db\""), T(";")] },
      { tokens: [K("import"), T(" { "), V("runSafetyFilter"), T(" } "), K("from"), T(" "), S("\"../lib/safety\""), T(";")] },
      { tokens: [] },
      { tokens: [K("export"), T(" "), K("async"), T(" "), K("function"), T(" "), F("runXPost"), T("() {")] },
      { tokens: [T("  "), K("const"), T(" "), V("trends"), T(" = "), K("await"), T(" "), V("db"), T("."), V("trends"), T("."), F("topN"), T("("), N("20"), T(");")] },
      { tokens: [T("  "), K("if"), T(" ("), V("trends"), T("."), V("length"), T(" === "), N("0"), T(") "), K("return"), T(" "), K("null"), T(";")] },
      { tokens: [] },
      { tokens: [T("  "), K("const"), T(" "), V("draft"), T(" = "), K("await"), T(" "), V("anthropic"), T("."), F("draft"), T("({ "), V("trends"), T(" });")] },
      { tokens: [T("  "), K("const"), T(" "), V("safety"), T(" = "), K("await"), T(" "), F("runSafetyFilter"), T("("), V("draft"), T("."), V("text"), T(");")] },
      { tokens: [T("  "), K("if"), T(" (!"), V("safety"), T("."), V("ok"), T(") {")] },
      { tokens: [T("    "), V("console"), T("."), F("warn"), T("("), S("\"[safety] blocked\""), T(", "), V("safety"), T("."), V("reasons"), T(");")] },
      { tokens: [T("    "), K("throw"), T(" "), K("new"), T(" "), F("Error"), T("("), S("\"safety failed\""), T(");")] },
      { tokens: [T("  }")] },
      { tokens: [] },
      { tokens: [T("  "), K("const"), T(" "), V("res"), T(" = "), K("await"), T(" "), F("postTweet"), T("("), V("draft"), T("."), V("text"), T(");")] },
      { tokens: [T("  "), K("await"), T(" "), V("db"), T("."), V("posts"), T("."), F("insert"), T("({ "), V("tweet_id"), T(": "), V("res"), T("."), V("id"), T(" });")] },
      { tokens: [T("  "), V("console"), T("."), F("log"), T("("), S("\"[x-post] published\""), T(", "), V("res"), T("."), V("id"), T(");")] },
      { tokens: [T("  "), K("return"), T(" "), V("res"), T(";")] },
      { tokens: [T("}")] },
    ],
  },

  // ───── 7. src/jobs/run.ts ─────
  {
    fileName: "src/jobs/run.ts",
    startFrame: 452,
    durationFrames: 32,
    lines: [
      { tokens: [K("import"), T(" { "), V("runXPost"), T(" } "), K("from"), T(" "), S("\"./x-post\""), T(";")] },
      { tokens: [K("import"), T(" { "), V("runThreadsPost"), T(" } "), K("from"), T(" "), S("\"./threads-post\""), T(";")] },
      { tokens: [K("import"), T(" { "), V("runNotePost"), T(" } "), K("from"), T(" "), S("\"./note-post\""), T(";")] },
      { tokens: [] },
      { tokens: [K("export"), T(" "), K("async"), T(" "), K("function"), T(" "), F("run"), T("() {")] },
      { tokens: [T("  "), K("const"), T(" "), V("started"), T(" = "), V("Date"), T("."), F("now"), T("();")] },
      { tokens: [T("  "), K("const"), T(" "), V("results"), T(" = "), K("await"), T(" "), TY("Promise"), T("."), F("allSettled"), T("([")] },
      { tokens: [T("    "), F("runXPost"), T("(),")] },
      { tokens: [T("    "), F("runThreadsPost"), T("(),")] },
      { tokens: [T("    "), F("runNotePost"), T("(),")] },
      { tokens: [T("  ]);")] },
      { tokens: [T("  "), V("console"), T("."), F("log"), T("("), S("\"[run] finished\""), T(", "), V("results"), T("."), V("length"), T(", "), S("\"jobs in\""), T(", "), V("Date"), T("."), F("now"), T("() - "), V("started"), T(", "), S("\"ms\""), T(");")] },
      { tokens: [T("}")] },
    ],
  },
];

// ===== ターミナル出力シーケンス =====
type TermLine = { at: number; content: string };
const TERM_LINES: TermLine[] = [
  { at: 490, content: "$ pnpm install" },
  { at: 498, content: "Progress: resolved 312, reused 287, downloaded 25, added 0" },
  { at: 506, content: "Progress: resolved 487, reused 412, downloaded 75, added 0" },
  { at: 510, content: "+ @anthropic-ai/sdk 0.62.0" },
  { at: 512, content: "+ twitter-api-v2 1.21.4" },
  { at: 514, content: "+ @supabase/supabase-js 2.46.1" },
  { at: 516, content: "+ zod 3.23.8" },
  { at: 518, content: "+ tsx 4.19.2" },
  { at: 520, content: "+ vitest 2.1.4" },
  { at: 526, content: "\x1b[32mdone\x1b[0m \x1b[2min 3.8s\x1b[0m" },

  { at: 534, content: "$ pnpm test" },
  { at: 544, content: "\x1b[2m  PASS  \x1b[0m tests/x-post.test.ts" },
  { at: 548, content: "\x1b[2m   ✓ \x1b[0m fetches top trends \x1b[2m(8ms)\x1b[0m" },
  { at: 550, content: "\x1b[2m   ✓ \x1b[0m generates a draft from trends \x1b[2m(124ms)\x1b[0m" },
  { at: 552, content: "\x1b[2m   ✓ \x1b[0m runs safety filter \x1b[2m(2ms)\x1b[0m" },
  { at: 554, content: "\x1b[2m   ✓ \x1b[0m rejects PII content \x1b[2m(1ms)\x1b[0m" },
  { at: 556, content: "\x1b[2m   ✓ \x1b[0m posts the draft to X \x1b[2m(58ms)\x1b[0m" },
  { at: 558, content: "\x1b[2m   ✓ \x1b[0m persists tweet_id in db \x1b[2m(12ms)\x1b[0m" },
  { at: 560, content: "" },
  { at: 562, content: "\x1b[32mTests: 12 passed\x1b[0m, 12 total" },
  { at: 564, content: "Time:  1.847s" },

  { at: 574, content: "$ git add -A && git commit -m \"feat: initial scaffold\"" },
  { at: 582, content: "[main 8f2a14c] feat: initial scaffold" },
  { at: 584, content: " 21 files changed, 612 insertions(+)" },

  { at: 592, content: "$ vercel deploy --prod" },
  { at: 600, content: "\x1b[2mVercel CLI 39.2.6\x1b[0m" },
  { at: 604, content: "\x1b[2m🔍 Inspect: https://vercel.com/studio/x-auto/9xKp2mNq8vTb\x1b[0m" },
  { at: 612, content: "\x1b[2m🔧 Building...\x1b[0m" },
  { at: 618, content: "\x1b[2m   • Compiling TypeScript\x1b[0m" },
  { at: 622, content: "\x1b[2m   • Bundling 21 files\x1b[0m" },
  { at: 626, content: "\x1b[2m   • Deploying to edge\x1b[0m" },
  { at: 634, content: "\x1b[32m✓ Ready\x1b[0m \x1b[2m in 23s\x1b[0m" },
  { at: 636, content: "" },
  { at: 638, content: "\x1b[32m●\x1b[0m Production: \x1b[36mhttps://x-auto.vercel.app\x1b[0m" },
];

// ===== AI チャットメッセージ =====
type ChatItem =
  | { kind: "user"; at: number; text: string }
  | { kind: "ai"; at: number; text: string }
  | { kind: "tool"; at: number; text: string };

const CHAT: ChatItem[] = [
  { kind: "user", at: 18,  text: "Twitterのトレンドから AI で投稿生成して自動投稿する SaaS 作って。Supabase + Vercel cron で。テストとデプロイも通して。" },
  { kind: "ai",   at: 46,  text: "わかりました。Anthropic SDK / twitter-api-v2 / Supabase で組みます。21ファイル生成 → テスト → デプロイまで一気に流します。" },
  { kind: "tool", at: 60,  text: "Creating 21 files…" },
  { kind: "tool", at: 130, text: "Writing package.json" },
  { kind: "tool", at: 172, text: "Writing src/lib/db.ts" },
  { kind: "tool", at: 228, text: "Writing src/lib/x.ts" },
  { kind: "tool", at: 276, text: "Writing src/lib/claude.ts" },
  { kind: "tool", at: 340, text: "Writing src/lib/safety.ts" },
  { kind: "tool", at: 384, text: "Writing src/jobs/x-post.ts" },
  { kind: "tool", at: 452, text: "Writing src/jobs/run.ts" },
  { kind: "tool", at: 490, text: "Running pnpm install" },
  { kind: "tool", at: 534, text: "Running pnpm test (12 tests)" },
  { kind: "tool", at: 574, text: "Committing 21 files to main" },
  { kind: "tool", at: 592, text: "Deploying to Vercel" },
  { kind: "ai",   at: 640, text: "完了。https://x-auto.vercel.app で稼働中。30 分 cron で X / Threads / note に同時投稿します。" },
];

// ===== 小コンポーネント =====
const FileIcon: React.FC<{ kind?: string; isDir?: boolean; open?: boolean }> = ({ kind, isDir, open }) => {
  if (isDir) {
    return (
      <span style={{ color: open ? "#dcb67a" : "#dcb67a", fontSize: 12, marginRight: 6 }}>
        {open ? "▾" : "▸"}
      </span>
    );
  }
  const colorMap: Record<string, string> = {
    ts: "#3178c6",
    json: "#cbcb41",
    yaml: "#a87fef",
    env: "#dcdcaa",
    git: "#f54d27",
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 12,
        marginRight: 6,
        background: colorMap[kind || ""] || "#888",
        borderRadius: 1,
      }}
    />
  );
};

// ===== メイン =====
export const IDEAutoBuildBait: React.FC = () => {
  const frame = useCurrentFrame();

  const visibleFiles = FILES.filter((f) => frame >= f.appearAt);

  // 現在エディタで開いているファイル
  const activeCodeStep = [...CODE_STEPS]
    .reverse()
    .find((s) => frame >= s.startFrame);

  // ===== エディタ: 高速タイプ (durationFrames で全行表示) =====
  const editorLines = (() => {
    if (!activeCodeStep) return { lines: [] as typeof CODE_STEPS[0]["lines"], partialCount: 0 };
    const elapsed = frame - activeCodeStep.startFrame;
    const linesPerFrame = activeCodeStep.lines.length / activeCodeStep.durationFrames;
    const visible = Math.min(
      activeCodeStep.lines.length,
      Math.max(1, Math.floor(elapsed * linesPerFrame) + 1)
    );
    return {
      lines: activeCodeStep.lines.slice(0, visible),
      partialCount: visible,
    };
  })();

  // 最終行までスクロール表示するため、上に詰めずに「最後の20行を表示」
  const MAX_VISIBLE_LINES = 22;
  const displayLines = editorLines.lines.slice(-MAX_VISIBLE_LINES);
  const lineNumberOffset = editorLines.lines.length - displayLines.length;

  const visibleTerm = TERM_LINES.filter((l) => frame >= l.at);
  const visibleChat = CHAT.filter((c) => frame >= c.at);

  const userText = CHAT[0].text;
  const typedUserText = (() => {
    if (frame < 6) return "";
    if (frame >= 18) return userText;
    const t = (frame - 6) / 12;
    return userText.slice(0, Math.floor(t * userText.length));
  })();

  const aiThinking = frame >= 18 && frame < 46;
  const thinkDot = Math.floor(frame / 6) % 3;

  const showDeployed = frame >= 638;
  const deployedOp = interpolate(frame, [638, 650], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: "'Segoe UI', 'Yu Gothic UI', 'Meiryo UI', system-ui, sans-serif" }}>
      {/* ====== タイトルバー (Windows 11風) ====== */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 32,
          background: "#252526",
          display: "flex",
          alignItems: "stretch",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {/* 左: アプリアイコン + メニュー */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 12px" }}>
          <div
            style={{
              width: 16,
              height: 16,
              background: "#0098ff",
              borderRadius: 2,
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✦
          </div>
          <div style={{ display: "flex", gap: 14, color: C.text, fontSize: 12 }}>
            <span>File</span>
            <span>Edit</span>
            <span>View</span>
            <span>Selection</span>
            <span>Go</span>
            <span>Run</span>
            <span>Terminal</span>
            <span>Help</span>
          </div>
        </div>

        {/* 中央: ウィンドウタイトル */}
        <div
          style={{
            flex: 1,
            textAlign: "center",
            color: C.textDim,
            fontSize: 12,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            alignSelf: "center",
          }}
        >
          x-auto-publisher — Cursor
        </div>

        {/* 右: Min / Max / Close ボタン */}
        <div style={{ display: "flex", alignItems: "stretch" }}>
          <div style={{ width: 46, display: "flex", alignItems: "center", justifyContent: "center", color: C.text, fontSize: 12 }}>
            ─
          </div>
          <div style={{ width: 46, display: "flex", alignItems: "center", justifyContent: "center", color: C.text, fontSize: 10 }}>
            ▢
          </div>
          <div style={{ width: 46, display: "flex", alignItems: "center", justifyContent: "center", color: C.text, fontSize: 11 }}>
            ✕
          </div>
        </div>
      </div>

      {/* ====== アクティビティバー ====== */}
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 0,
          bottom: 0,
          width: 48,
          background: C.activity,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 12,
          gap: 18,
        }}
      >
        {[
          { s: "▤", active: true,  badge: null },
          { s: "⌕", active: false, badge: null },
          { s: "⎇", active: false, badge: visibleFiles.filter((f) => !f.isDir).length },  // Source Control: 変更ファイル数
          { s: "▶", active: false, badge: null },
          { s: "✦", active: false, badge: null },
          { s: "⚠", active: false, badge: 2 },  // Problems: 2 issues
          { s: "⚙", active: false, badge: null },
        ].map((it, i) => (
          <div
            key={i}
            style={{
              color: it.active ? C.text : C.textVeryDim,
              fontSize: 20,
              fontWeight: 400,
              borderLeft: it.active ? `2px solid ${C.text}` : "2px solid transparent",
              paddingLeft: 8,
              marginLeft: -2,
              width: 24,
              textAlign: "center",
              position: "relative",
            }}
          >
            {it.s}
            {it.badge !== null && it.badge > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: -4,
                  right: -8,
                  background: "#1d9bf0",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  borderRadius: 8,
                  minWidth: 16,
                  height: 14,
                  padding: "0 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  fontFamily: "'Segoe UI', sans-serif",
                }}
              >
                {it.badge}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ====== ファイルツリー ====== */}
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 48,
          bottom: 0,
          width: 240,
          background: C.sidebar,
          borderRight: `1px solid ${C.border}`,
          color: C.text,
          fontFamily: "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace",
          fontSize: 13,
          paddingTop: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "6px 14px",
            color: C.textDim,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          Explorer
        </div>
        <div
          style={{
            padding: "4px 14px 8px",
            color: C.text,
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          ▾ X-AUTO-PUBLISHER
        </div>
        <div style={{ paddingBottom: 8 }}>
          {visibleFiles.map((f) => {
            const isActive =
              !f.isDir &&
              activeCodeStep &&
              f.path === activeCodeStep.fileName;
            const name = f.path.split("/").pop() || f.path;
            return (
              <div
                key={f.path}
                style={{
                  padding: "1px 14px",
                  paddingLeft: 14 + f.depth * 12,
                  background: isActive ? "rgba(55, 90, 130, 0.4)" : "transparent",
                  color: C.text,
                  display: "flex",
                  alignItems: "center",
                  lineHeight: "18px",
                }}
              >
                <FileIcon kind={f.icon} isDir={f.isDir} open={f.isDir} />
                <span style={{ fontSize: 12 }}>{name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====== エディタ領域 ====== */}
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 288,
          right: 540,
          bottom: 360,
        }}
      >
        {/* タブバー */}
        <div
          style={{
            height: 36,
            background: C.tabsBar,
            display: "flex",
            alignItems: "flex-end",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          {activeCodeStep && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 35,
                padding: "0 14px",
                background: C.tabActive,
                color: C.text,
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                borderRight: `1px solid ${C.border}`,
                borderTop: `1px solid #3b82f6`,
              }}
            >
              <FileIcon kind={activeCodeStep.fileName.endsWith(".json") ? "json" : "ts"} />
              <span>{activeCodeStep.fileName.split("/").pop()}</span>
              <span style={{ color: C.textVeryDim, marginLeft: 6 }}>●</span>
            </div>
          )}
        </div>

        {activeCodeStep && (
          <div
            style={{
              padding: "4px 16px",
              color: C.textDim,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              background: C.bg,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            x-auto-publisher › {activeCodeStep.fileName.replace(/\//g, " › ")}
          </div>
        )}

        {/* コード */}
        <div
          style={{
            position: "absolute",
            inset: "65px 0 0 0",
            background: C.bg,
            padding: "10px 0",
            fontFamily: "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace",
            fontSize: 13,
            color: C.text,
            overflow: "hidden",
          }}
        >
          {displayLines.map((ln, i) => {
            const absoluteIndex = lineNumberOffset + i;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  lineHeight: "20px",
                  paddingRight: 16,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 44,
                    color: C.textVeryDim,
                    textAlign: "right",
                    paddingRight: 12,
                    userSelect: "none",
                  }}
                >
                  {absoluteIndex + 1}
                </span>
                <span style={{ whiteSpace: "pre" }}>
                  {ln.tokens.map((tk, ti) => (
                    <span key={ti} style={{ color: tk.c }}>
                      {tk.t}
                    </span>
                  ))}
                </span>
                {i === displayLines.length - 1 &&
                  activeCodeStep &&
                  frame - activeCodeStep.startFrame < activeCodeStep.durationFrames && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 7,
                        height: 14,
                        marginLeft: 2,
                        background: C.cursor,
                        opacity: Math.sin(frame * 0.7) > 0 ? 1 : 0,
                        verticalAlign: "middle",
                      }}
                    />
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ====== Minimap ====== */}
      {activeCodeStep && (
        <div
          style={{
            position: "absolute",
            top: 32 + 65,
            right: 480,
            width: 60,
            bottom: 360,
            background: C.bg,
            borderLeft: `1px solid ${C.border}`,
            padding: "8px 4px",
            overflow: "hidden",
          }}
        >
          <svg width={52} height={460} style={{ display: "block" }}>
            {activeCodeStep.lines.slice(0, 60).map((ln, i) => {
              const y = i * 7 + 4;
              let x = 4;
              return (
                <g key={i}>
                  {ln.tokens.map((tk, ti) => {
                    const w = Math.min(46 - (x - 4), tk.t.length * 0.9);
                    if (w <= 0) return null;
                    const el = (
                      <rect
                        key={ti}
                        x={x}
                        y={y}
                        width={w}
                        height={3}
                        fill={tk.c}
                        opacity={i < (editorLines.partialCount || 0) ? 0.7 : 0.15}
                      />
                    );
                    x += w + 0.5;
                    return el;
                  })}
                </g>
              );
            })}
            {/* 現在のビューポートインジケータ */}
            <rect
              x={0}
              y={Math.max(0, (editorLines.partialCount || 0) * 7 - 70)}
              width={52}
              height={70}
              fill="#fff"
              opacity={0.06}
            />
          </svg>
        </div>
      )}

      {/* ====== ターミナル ====== */}
      <div
        style={{
          position: "absolute",
          left: 288,
          right: 480,
          bottom: 0,
          height: 360,
          background: C.panel,
          borderTop: `1px solid ${C.border}`,
          fontFamily: "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace",
        }}
      >
        <div
          style={{
            height: 32,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            borderBottom: `1px solid ${C.border}`,
            gap: 22,
            color: C.textDim,
            fontSize: 11,
          }}
        >
          <span>PROBLEMS</span>
          <span>OUTPUT</span>
          <span>DEBUG CONSOLE</span>
          <span style={{ color: C.text, borderBottom: `1px solid ${C.text}`, paddingBottom: 7 }}>
            TERMINAL
          </span>
        </div>
        <div
          style={{
            padding: "10px 16px",
            color: C.text,
            fontSize: 13,
            lineHeight: 1.4,
            height: 318,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column-reverse",
          }}
        >
          <div>
            {visibleTerm.slice(-22).map((l, i) => (
              <AnsiLine key={i} content={l.content} />
            ))}
            {frame >= 640 && (
              <div style={{ color: C.green }}>
                ${" "}
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 14,
                    background: C.cursor,
                    verticalAlign: "middle",
                    opacity: Math.sin(frame * 0.7) > 0 ? 1 : 0,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== Cursor AI チャットパネル ====== */}
      <div
        style={{
          position: "absolute",
          top: 32,
          right: 0,
          bottom: 0,
          width: 480,
          background: C.sidebar,
          borderLeft: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "10px 16px",
            color: C.textDim,
            fontSize: 11,
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span style={{ textTransform: "uppercase", letterSpacing: 0.6 }}>Chat</span>
          <span style={{ color: C.textVeryDim }}>claude-opus-4-5 · agent</span>
        </div>

        <div
          style={{
            flex: 1,
            padding: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            color: C.text,
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          {visibleChat.slice(-12).map((m, i) => {
            if (m.kind === "user") {
              const isTyping = frame < 18 && i === 0;
              return (
                <div key={i} style={{ alignSelf: "flex-end", maxWidth: "92%" }}>
                  <div style={{ color: C.textVeryDim, fontSize: 10, marginBottom: 3, textAlign: "right" }}>
                    you
                  </div>
                  <div
                    style={{
                      background: "#2a2d35",
                      borderRadius: 8,
                      padding: "8px 12px",
                      whiteSpace: "pre-wrap",
                      fontSize: 13,
                    }}
                  >
                    {isTyping ? typedUserText : m.text}
                    {isTyping && frame >= 6 && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 7,
                          height: 14,
                          marginLeft: 2,
                          background: C.cursor,
                          verticalAlign: "middle",
                          opacity: Math.sin(frame * 0.7) > 0 ? 1 : 0,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            }
            if (m.kind === "ai") {
              return (
                <div key={i} style={{ maxWidth: "96%" }}>
                  <div style={{ color: C.textVeryDim, fontSize: 10, marginBottom: 3 }}>
                    <span style={{ color: "#cc785c" }}>✦</span> claude-opus-4-5
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{m.text}</div>
                </div>
              );
            }
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  color: C.textDim,
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <span style={{ color: C.green }}>✓</span>
                <span>{m.text}</span>
              </div>
            );
          })}

          {aiThinking && (
            <div style={{ display: "flex", gap: 4, color: C.textDim, fontSize: 12 }}>
              <span style={{ color: "#cc785c" }}>✦</span>
              <span>thinking{".".repeat(thinkDot + 1)}</span>
            </div>
          )}
        </div>

        <div
          style={{
            margin: 12,
            padding: "10px 12px",
            background: "#1f2128",
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            color: C.textVeryDim,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Ask anything (Ctrl+L)</span>
          <span style={{ fontSize: 10 }}>agent ▾</span>
        </div>
      </div>

      {/* ====== deployed 完了通知 (VSCode通知トースト風) ====== */}
      {showDeployed && (
        <div
          style={{
            position: "absolute",
            bottom: 36,
            right: 500,
            width: 322,
            background: "#252526",
            border: "1px solid #454545",
            borderRadius: 4,
            boxShadow: "0 6px 20px rgba(0,0,0,0.55)",
            opacity: deployedOp,
            transform: `translateX(${(1 - deployedOp) * 26}px)`,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}
        >
          <div style={{ display: "flex", gap: 10, padding: "12px 14px" }}>
            <span style={{ color: C.green, fontSize: 15, lineHeight: 1.1 }}>✓</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>
                Deployed to production
              </div>
              <div
                style={{
                  color: C.textDim,
                  fontSize: 11.5,
                  marginTop: 3,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                https://x-auto.vercel.app · ready in 23s
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 9 }}>
                <span style={{ color: "#3794ff", fontSize: 12, fontWeight: 500 }}>Open</span>
                <span style={{ color: "#3794ff", fontSize: 12, fontWeight: 500 }}>Copy URL</span>
                <span style={{ color: C.textDim, fontSize: 12 }}>View Logs</span>
              </div>
            </div>
            <span style={{ color: C.textDim, fontSize: 12, alignSelf: "flex-start" }}>✕</span>
          </div>
        </div>
      )}

      {/* ====== ステータスバー ====== */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 22,
          background: "#007acc",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          color: "#fff",
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          gap: 14,
          zIndex: 50,
        }}
      >
        <span>⎇ main</span>
        <span>{frame < 580 ? "○ 0↓ 0↑" : "✓ 0↓ 1↑"}</span>
        <span>{frame < 544 ? "" : "✓ 12 tests"}</span>
        <span style={{ marginLeft: "auto" }}>TypeScript</span>
        <span>UTF-8</span>
        <span>LF</span>
        <span>{`Ln ${Math.max(1, editorLines.partialCount)}, Col 1`}</span>
      </div>
    </AbsoluteFill>
  );
};

// ===== ANSI簡易パーサ =====
const AnsiLine: React.FC<{ content: string }> = ({ content }) => {
  const parts: { text: string; color?: string; dim?: boolean }[] = [];
  let cur = { text: "", color: undefined as string | undefined, dim: false };
  const flush = () => {
    if (cur.text) parts.push({ ...cur });
    cur = { ...cur, text: "" };
  };
  let i = 0;
  while (i < content.length) {
    if (content[i] === "\x1b" && content[i + 1] === "[") {
      flush();
      const end = content.indexOf("m", i);
      const code = content.slice(i + 2, end);
      if (code === "0") {
        cur.color = undefined;
        cur.dim = false;
      } else if (code === "2") {
        cur.dim = true;
      } else if (code === "32") {
        cur.color = C.green;
      } else if (code === "33") {
        cur.color = C.yellow;
      } else if (code === "36") {
        cur.color = "#56b6c2";
      } else if (code === "31") {
        cur.color = C.red;
      }
      i = end + 1;
    } else {
      cur.text += content[i];
      i++;
    }
  }
  flush();
  return (
    <div>
      {parts.map((p, idx) => (
        <span key={idx} style={{ color: p.color || C.text, opacity: p.dim ? 0.65 : 1 }}>
          {p.text}
        </span>
      ))}
    </div>
  );
};
