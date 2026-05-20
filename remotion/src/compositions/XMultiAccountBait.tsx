import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

// ============================================================
// XMultiAccountBait
// X 12アカウントを一画面で同時管理してる風のダッシュボード。
// 各アカウントが独立して「下書き作成→投稿→反応取得」を回す。
// 1920×1080、30fps、20秒 (600 frames)
// ============================================================

const C = {
  bg: "#000000",                 // Xの黒テーマ
  panel: "#16181c",
  panelHover: "#1d1f23",
  border: "#2f3336",
  text: "#e7e9ea",
  textMuted: "#71767b",
  textVeryDim: "#536471",
  link: "#1d9bf0",
  green: "#00ba7c",
  red: "#f4212e",
  yellow: "#ffd400",
  highlight: "#1d9bf0",
};

type Status = "idle" | "drafting" | "posting" | "posted" | "analyzing";

type Event = {
  at: number;
  status: Status;
  tweet?: string;
  newFollowers?: number;
};

type Account = {
  handle: string;
  name: string;
  avatarColor: string;
  initial: string;
  baseFollowers: number;
  basePosts: number;
  events: Event[];
};

// 各アカウントのプロフィール bio
const BIOS: Record<string, string> = {
  "@studio_eng":   "自動化 / Claude Code / 個人開発｜寝てる間に動くものを作る",
  "@ai_dori":      "AIの「やばい」を毎日検証｜通知ON推奨｜PR/案件はDMへ",
  "@nemui_lab":    "寝てる間に収益化する仕組みを公開中｜元SIer→個人開発",
  "@growth_jin":   "SaaSグロース10年｜MRR/Churn/LTVを実データで語る",
  "@indie_jp":     "個人開発で月7桁｜失敗も全部書く｜サウナとコード",
  "@cursor_tips":  "Cursor / Claude Code の実践Tips毎日｜現役エンジニア",
  "@viral_lab":    "バズ投稿を1000本解析｜伸びる型を体系化して配布",
  "@sub_yume":     "副業0→月10万までの最短ルート｜2児の父｜会社員",
  "@no_code_jp":   "ノーコードで作る自動化SaaS｜初心者向けに解説",
  "@prompt_kit":   "プロンプト設計の専門｜Claude/GPTを10倍使う型を配布",
  "@auto_factory": "n8n×Claudeで月3000本量産｜BtoB自動化コンサル",
  "@studio_en":    "Building in public｜AI agents, automation, SaaS｜JP→EN",
};

// 認証バッジ付きアカウント
const VERIFIED = new Set(["@studio_eng", "@ai_dori", "@viral_lab", "@growth_jin", "@cursor_tips", "@auto_factory", "@prompt_kit"]);

const ACCOUNTS: Account[] = [
  {
    handle: "@studio_eng",
    name: "Studio / 自動化",
    avatarColor: "#1d9bf0",
    initial: "S",
    baseFollowers: 18472,
    basePosts: 1247,
    events: [
      { at: 8,   status: "drafting", tweet: "Claude Code に「SaaS作って」だけ言って寝た結果…" },
      { at: 60,  status: "posting", tweet: "Claude Code に「SaaS作って」だけ言って寝た結果…" },
      { at: 92,  status: "posted",  tweet: "Claude Code に「SaaS作って」だけ言って寝た結果…", newFollowers: 47 },
      { at: 280, status: "analyzing" },
    ],
  },
  {
    handle: "@ai_dori",
    name: "AIドリすけ",
    avatarColor: "#7c3aed",
    initial: "A",
    baseFollowers: 47218,
    basePosts: 3847,
    events: [
      { at: 22,  status: "drafting", tweet: "やばい。これマジで動いてる" },
      { at: 72,  status: "posting", tweet: "やばい。これマジで動いてる" },
      { at: 110, status: "posted",  tweet: "やばい。これマジで動いてる", newFollowers: 184 },
      { at: 360, status: "drafting", tweet: "Cursor 1.4 がやばい件" },
    ],
  },
  {
    handle: "@nemui_lab",
    name: "寝てる間に研究所",
    avatarColor: "#cc785c",
    initial: "N",
    baseFollowers: 8472,
    basePosts: 487,
    events: [
      { at: 4,   status: "drafting", tweet: "寝てる間に MRR が +¥184,000 になってた話" },
      { at: 48,  status: "posting", tweet: "寝てる間に MRR が +¥184,000 になってた話" },
      { at: 82,  status: "posted",  tweet: "寝てる間に MRR が +¥184,000 になってた話", newFollowers: 28 },
    ],
  },
  {
    handle: "@growth_jin",
    name: "ジン / グロース",
    avatarColor: "#10b981",
    initial: "J",
    baseFollowers: 24847,
    basePosts: 2147,
    events: [
      { at: 38,  status: "drafting", tweet: "Stripe → note の収益移管で気をつけたいこと3つ" },
      { at: 96,  status: "posting", tweet: "Stripe → note の収益移管で気をつけたいこと3つ" },
      { at: 130, status: "posted",  tweet: "Stripe → note の収益移管で気をつけたいこと3つ", newFollowers: 62 },
    ],
  },
  {
    handle: "@indie_jp",
    name: "個人開発の会",
    avatarColor: "#f59e0b",
    initial: "I",
    baseFollowers: 12847,
    basePosts: 712,
    events: [
      { at: 14,  status: "drafting", tweet: "個人開発で月100万到達するまでの全プロセス公開" },
      { at: 68,  status: "posting", tweet: "個人開発で月100万到達するまでの全プロセス公開" },
      { at: 104, status: "posted",  tweet: "個人開発で月100万到達するまでの全プロセス公開", newFollowers: 84 },
      { at: 340, status: "analyzing" },
    ],
  },
  {
    handle: "@cursor_tips",
    name: "Cursor 活用術",
    avatarColor: "#3b82f6",
    initial: "C",
    baseFollowers: 18247,
    basePosts: 1547,
    events: [
      { at: 28,  status: "drafting", tweet: "Cursor の Composer で12個のファイルを一気に書き換えた話" },
      { at: 84,  status: "posting", tweet: "Cursor の Composer で12個のファイルを一気に書き換えた話" },
      { at: 124, status: "posted",  tweet: "Cursor の Composer で12個のファイルを一気に書き換えた話", newFollowers: 73 },
    ],
  },
  {
    handle: "@viral_lab",
    name: "バズ研究所",
    avatarColor: "#ec4899",
    initial: "V",
    baseFollowers: 84247,
    basePosts: 4287,
    events: [
      { at: 6,   status: "drafting", tweet: "バズるツイートの構造を1000本分析したらこうなった" },
      { at: 56,  status: "posting", tweet: "バズるツイートの構造を1000本分析したらこうなった" },
      { at: 96,  status: "posted",  tweet: "バズるツイートの構造を1000本分析したらこうなった", newFollowers: 312 },
      { at: 380, status: "drafting", tweet: "新しい分析方法を試してます" },
    ],
  },
  {
    handle: "@sub_yume",
    name: "副業の夢",
    avatarColor: "#22d3ee",
    initial: "S",
    baseFollowers: 4287,
    basePosts: 224,
    events: [
      { at: 42,  status: "drafting", tweet: "副業で月10万までの最短ルート公開します" },
      { at: 102, status: "posting", tweet: "副業で月10万までの最短ルート公開します" },
      { at: 142, status: "posted",  tweet: "副業で月10万までの最短ルート公開します", newFollowers: 41 },
    ],
  },
  {
    handle: "@no_code_jp",
    name: "ノーコード Japan",
    avatarColor: "#84cc16",
    initial: "N",
    baseFollowers: 7847,
    basePosts: 412,
    events: [
      { at: 18,  status: "drafting", tweet: "コード書かずに自動投稿SaaS作る手順" },
      { at: 76,  status: "posting", tweet: "コード書かずに自動投稿SaaS作る手順" },
      { at: 116, status: "posted",  tweet: "コード書かずに自動投稿SaaS作る手順", newFollowers: 38 },
    ],
  },
  {
    handle: "@prompt_kit",
    name: "プロンプト工房",
    avatarColor: "#a78bfa",
    initial: "P",
    baseFollowers: 14847,
    basePosts: 824,
    events: [
      { at: 32,  status: "drafting", tweet: "Claude を10倍賢く使うシステムプロンプト3選" },
      { at: 90,  status: "posting", tweet: "Claude を10倍賢く使うシステムプロンプト3選" },
      { at: 130, status: "posted",  tweet: "Claude を10倍賢く使うシステムプロンプト3選", newFollowers: 92 },
      { at: 400, status: "analyzing" },
    ],
  },
  {
    handle: "@auto_factory",
    name: "自動化工場",
    avatarColor: "#f97316",
    initial: "F",
    baseFollowers: 22147,
    basePosts: 1847,
    events: [
      { at: 10,  status: "drafting", tweet: "n8n + Claude で月3000本の記事を量産する仕組み" },
      { at: 62,  status: "posting", tweet: "n8n + Claude で月3000本の記事を量産する仕組み" },
      { at: 100, status: "posted",  tweet: "n8n + Claude で月3000本の記事を量産する仕組み", newFollowers: 124 },
    ],
  },
  {
    handle: "@studio_en",
    name: "Studio (EN)",
    avatarColor: "#0ea5e9",
    initial: "S",
    baseFollowers: 3247,
    basePosts: 187,
    events: [
      { at: 26,  status: "drafting", tweet: "I let Claude Code build a SaaS while I slept. Wild." },
      { at: 80,  status: "posting", tweet: "I let Claude Code build a SaaS while I slept. Wild." },
      { at: 120, status: "posted",  tweet: "I let Claude Code build a SaaS while I slept. Wild.", newFollowers: 47 },
    ],
  },
];

// 現フレームでのアカウント状態
const getAccountState = (acc: Account, frame: number) => {
  const active = [...acc.events].reverse().find((e) => frame >= e.at);
  const status: Status = active?.status || "idle";
  const tweet = active?.tweet || "";

  // フォロワー増加: postedイベント以降ジワジワ増える
  const postedEvent = acc.events.find((e) => e.status === "posted" && frame >= e.at);
  const followerBoost = postedEvent
    ? Math.floor(((frame - postedEvent.at) / 200) * (postedEvent.newFollowers || 0))
    : 0;
  const followers = acc.baseFollowers + followerBoost;

  // 投稿数: posted ごとに +1
  const postsAdded = acc.events.filter((e) => e.status === "posted" && frame >= e.at).length;
  const posts = acc.basePosts + postsAdded;

  const seed = acc.baseFollowers;
  // アカウント固有の係数 (決定論的に散らす)
  const r1 = ((seed % 97) / 97);   // 0..1
  const r2 = ((seed % 53) / 53);
  const r3 = ((seed % 31) / 31);

  // ---- 最新ツイートのパフォーマンス ----
  // 実Xの伸び方: 投稿直後に急、その後対数的に鈍化 (24hで頭打ち)
  const postedNow = [...acc.events].reverse().find((e) => e.status === "posted" && frame >= e.at);
  const tElapsed = postedNow ? frame - postedNow.at : 0;
  // ピーク表示回数 = フォロワーの 2.4〜9倍 (おすすめ/RT流入込み、バズ気味)
  const peakViews = Math.floor(seed * (2.4 + r1 * 6.6));
  const growth = 1 - Math.exp(-tElapsed / 95); // 約3秒で63%、対数カーブ
  const views = postedNow ? Math.floor(peakViews * (0.12 + 0.88 * growth)) : 0;
  // 実際の比率: like率は表示回数の 0.9〜2.4%
  const likeRate = 0.009 + r2 * 0.015;
  const likes = Math.floor(views * likeRate);
  const reposts = Math.floor(likes * (0.09 + r3 * 0.07));   // like比 9〜16%
  const replies = Math.floor(likes * (0.035 + r1 * 0.03));  // like比 3.5〜6.5%
  const quotes = Math.floor(likes * (0.02 + r3 * 0.02));    // like比 2〜4%
  const bookmarks = Math.floor(likes * (0.18 + r2 * 0.18)); // like比 18〜36% (技術系は高め)

  // 公式エンゲージメント率の定義: (like+RT+reply+quote+bookmark) / impressions
  const engagement =
    views > 0
      ? (likes + reposts + replies + quotes + bookmarks) / views
      : 0.018 + r2 * 0.012;

  // 24h インプレッション = フォロワー × 3.5〜7 (1日の投稿数ぶん)
  const impressions =
    Math.floor(followers * (3.5 + r1 * 3.5)) + Math.floor(frame * ((seed % 40) + 12));
  const todayFollowers = followers - acc.baseFollowers;
  const todayPosts = acc.events.filter((e) => e.status === "posted" && frame >= e.at).length;

  // 予約キュー / 次回投稿 / 自動応答
  const queue = (seed % 9) + 4;
  const nextPost = ["18:00", "19:00", "20:00", "21:00", "12:00", "07:30"][seed % 6];
  const autoReplies = (seed % 28) + 8 + Math.floor(frame * 0.03);

  // フォロワー推移スパークライン (14点)
  const spark: number[] = [];
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const v =
      24 + t * 52 + Math.sin(i * 1.7 + seed) * 7 + Math.cos(i * 0.9 + seed) * 4 +
      (i >= 12 ? Math.min(14, tElapsed * 0.4) : 0);
    spark.push(Math.max(6, Math.min(96, v)));
  }

  // 進捗 (status === "posting" 中の進捗バー)
  const postingEvent = acc.events.find((e) => e.status === "posting");
  const postedEv = acc.events.find((e) => e.status === "posted");
  const inPosting = postingEvent && postedEv && frame >= postingEvent.at && frame < postedEv.at;
  const postProgress = inPosting && postingEvent && postedEv
    ? (frame - postingEvent.at) / (postedEv.at - postingEvent.at)
    : 0;

  return {
    status, tweet, followers, posts, engagement, postProgress, inPosting,
    views, likes, reposts, replies, bookmarks,
    impressions, todayFollowers, todayPosts,
    queue, nextPost, autoReplies, spark,
  };
};

// 数値の短縮表記 (12.4k / 1.2M)
const short = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
};

// ===== グローバルアクティビティフィード =====
type Activity = { at: number; account: string; text: string };

const buildActivities = (): Activity[] => {
  const out: Activity[] = [];
  for (const acc of ACCOUNTS) {
    for (const e of acc.events) {
      if (e.status === "posted") {
        out.push({ at: e.at, account: acc.handle, text: `posted · ${(e.tweet || "").slice(0, 40)}…` });
        if (e.newFollowers) {
          out.push({ at: e.at + 8, account: acc.handle, text: `+${e.newFollowers} followers` });
          out.push({ at: e.at + 16, account: acc.handle, text: `engagement +${(Math.random() * 4 + 2).toFixed(1)}%` });
        }
      } else if (e.status === "drafting") {
        out.push({ at: e.at, account: acc.handle, text: "drafting…" });
      } else if (e.status === "posting") {
        out.push({ at: e.at, account: acc.handle, text: "POST /2/tweets" });
      } else if (e.status === "analyzing") {
        out.push({ at: e.at, account: acc.handle, text: "analyzing engagement" });
      }
    }
  }
  return out.sort((a, b) => a.at - b.at);
};

const ALL_ACTIVITIES = buildActivities();

const fmt = (n: number) => n.toLocaleString("ja-JP");

export const XMultiAccountBait: React.FC = () => {
  const frame = useCurrentFrame();

  // KPIサマリ
  const totalFollowers = ACCOUNTS.reduce(
    (sum, acc) => sum + getAccountState(acc, frame).followers,
    0
  );
  const totalPosts = ACCOUNTS.reduce(
    (sum, acc) => sum + getAccountState(acc, frame).posts,
    0
  );
  const todayPosts = ACCOUNTS.reduce(
    (sum, acc) =>
      sum +
      acc.events.filter((e) => e.status === "posted" && frame >= e.at).length,
    0
  );
  const newFollowersToday = ACCOUNTS.reduce((sum, acc) => {
    const state = getAccountState(acc, frame);
    return sum + (state.followers - acc.baseFollowers);
  }, 0);

  const activeAccounts = ACCOUNTS.filter((acc) => {
    const s = getAccountState(acc, frame).status;
    return s === "drafting" || s === "posting" || s === "analyzing";
  }).length;

  const recentActivities = ALL_ACTIVITIES.filter((a) => frame >= a.at).slice(-12).reverse();

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
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 22,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: "#fff",
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 16,
          }}
        >
          𝕏
        </div>
        <span style={{ color: C.text, fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>
          xpilot · multi-account control
        </span>
        <div style={{ display: "flex", gap: 18, color: C.textMuted, fontSize: 13, marginLeft: 18 }}>
          <span style={{ color: C.text, fontWeight: 500 }}>ダッシュボード</span>
          <span>投稿予約</span>
          <span>分析</span>
          <span>自動応答</span>
          <span>設定</span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          {/* 同時稼働インジケータ */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px",
              background: "rgba(0, 186, 124, 0.1)",
              border: `1px solid ${C.green}44`,
              borderRadius: 4,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: C.green,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: C.green,
                opacity: Math.sin(frame * 0.25) * 0.3 + 0.7,
              }}
            />
            <span>{activeAccounts} active · {ACCOUNTS.length} accounts</span>
          </div>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#1d9bf0",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            S
          </div>
        </div>
      </div>

      {/* ====== KPIストリップ ====== */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 0,
          right: 0,
          height: 60,
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 26,
          padding: "0 20px",
        }}
      >
        {[
          { label: "TOTAL FOLLOWERS",        value: fmt(totalFollowers) },
          { label: "POSTS · TOTAL",          value: fmt(totalPosts) },
          { label: "POSTS · TODAY",          value: `${todayPosts}` },
          { label: "NEW FOLLOWERS · TODAY",  value: `+${fmt(newFollowersToday)}` },
          { label: "IMPRESSIONS · 24H",      value: `${(1.84 + frame * 0.0018).toFixed(2)}M` },
          { label: "ENGAGEMENT · AVG",       value: `${(4.2 + Math.sin(frame * 0.03) * 0.3).toFixed(2)}%` },
          { label: "MENTIONS · 24H",         value: `${127 + Math.floor(frame * 0.15)}` },
          { label: "REPLIES SCHEDULED",      value: `${48 + Math.floor(frame * 0.04) % 18}` },
          { label: "AUTOMATIONS RUNNING",    value: `${activeAccounts} / ${ACCOUNTS.length}` },
        ].map((k, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                color: C.textVeryDim,
                fontSize: 9,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 0.6,
              }}
            >
              {k.label}
            </span>
            <span
              style={{
                color: C.text,
                fontSize: 16,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {k.value}
            </span>
          </div>
        ))}
      </div>

      {/* ====== アカウントグリッド (左) ====== */}
      <div
        style={{
          position: "absolute",
          top: 124,
          left: 14,
          right: 380,
          bottom: 14,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        {ACCOUNTS.map((acc) => {
          const s = getAccountState(acc, frame);
          const isActive = s.status === "drafting" || s.status === "posting";
          return (
            <div
              key={acc.handle}
              style={{
                background: C.panel,
                border: `1px solid ${isActive ? "#1d9bf0aa" : C.border}`,
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* 進捗ライン (下端) */}
              {s.inPosting && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    height: 2,
                    width: `${Math.min(100, s.postProgress * 100)}%`,
                    background: "#1d9bf0",
                  }}
                />
              )}

              {/* ヘッダ */}
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: `linear-gradient(140deg, ${acc.avatarColor}, rgba(0,0,0,0.42))`,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                    flexShrink: 0,
                    boxShadow: isActive
                      ? `0 0 0 2px ${acc.avatarColor}55, inset 0 1px 0 rgba(255,255,255,0.18)`
                      : "inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  {acc.initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span
                      style={{
                        color: C.text,
                        fontSize: 13,
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {acc.name}
                    </span>
                    {VERIFIED.has(acc.handle) && (
                      <svg width={13} height={13} viewBox="0 0 22 22" style={{ flexShrink: 0 }}>
                        <path
                          fill="#1d9bf0"
                          d="M20.4 11l-2-2.3.3-3-3-.7-1.5-2.6L11.5 3.7 8.8 2.4 7.3 5l-3 .7.3 3-2 2.3 2 2.3-.3 3 3 .7 1.5 2.6 2.7-1.3 2.7 1.3 1.5-2.6 3-.7-.3-3z"
                        />
                        <path fill="#fff" d="M9.8 14.3l-3-3 1.2-1.2 1.8 1.8 4-4 1.2 1.2z" />
                      </svg>
                    )}
                  </div>
                  <div
                    style={{
                      color: C.textMuted,
                      fontSize: 10,
                      marginTop: 1,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {acc.handle}
                  </div>
                </div>
                <StatusBadge status={s.status} frame={frame} />
              </div>

              {/* bio */}
              <div
                style={{
                  color: C.textVeryDim,
                  fontSize: 10,
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {BIOS[acc.handle]}
              </div>

              {/* 最新ツイート */}
              <div
                style={{
                  color: C.text,
                  fontSize: 11,
                  lineHeight: 1.35,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  minHeight: 30,
                }}
              >
                {s.tweet || (
                  <span style={{ color: C.textVeryDim, fontStyle: "italic" }}>
                    次の投稿を生成中…
                  </span>
                )}
              </div>

              {/* エンゲージメント */}
              <div
                style={{
                  display: "flex",
                  gap: 13,
                  color: C.textMuted,
                  fontSize: 10,
                  fontVariantNumeric: "tabular-nums",
                  opacity: s.views > 0 ? 1 : 0.3,
                }}
              >
                <EngStat kind="reply" value={short(s.replies)} />
                <EngStat kind="repost" value={short(s.reposts)} />
                <EngStat kind="like" value={short(s.likes)} />
                <EngStat kind="view" value={short(s.views)} />
                <EngStat kind="bm" value={short(s.bookmarks)} />
              </div>

              {/* メトリクスグリッド */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "5px 6px",
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 6,
                }}
              >
                {(
                  [
                    ["followers", fmt(s.followers), C.text],
                    ["today", `+${fmt(s.todayFollowers)}`, C.green],
                    ["posts", fmt(s.posts), C.text],
                    ["eng率", `${(s.engagement * 100).toFixed(2)}%`, C.text],
                    ["impr·24h", short(s.impressions), C.text],
                    ["queue", `${s.queue}`, C.text],
                    ["auto-reply", `${s.autoReplies}`, C.text],
                    ["next", s.nextPost, C.link],
                  ] as [string, string, string][]
                ).map(([label, val, col]) => (
                  <div key={label} style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: C.textVeryDim,
                        fontSize: 8,
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        color: col,
                        fontSize: 11,
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {/* フォロワー推移 sparkline */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    color: C.textVeryDim,
                    fontSize: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: "nowrap",
                  }}
                >
                  7d
                </span>
                <svg viewBox="0 0 100 18" preserveAspectRatio="none" style={{ flex: 1, height: 18 }}>
                  {(() => {
                    const d = s.spark
                      .map((v, i) => {
                        const x = (i / (s.spark.length - 1)) * 100;
                        const y = 18 - (v / 100) * 16 - 1;
                        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(" ");
                    return (
                      <>
                        <path d={`${d} L100,18 L0,18 Z`} fill="#1d9bf022" />
                        <path d={d} stroke="#1d9bf0" strokeWidth={1.2} fill="none" />
                      </>
                    );
                  })()}
                </svg>
                <span
                  style={{
                    color: C.green,
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: "nowrap",
                  }}
                >
                  ↑{((s.todayFollowers / Math.max(1, acc.baseFollowers)) * 100 + 2.4).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ====== 右: アクティビティフィード ====== */}
      <div
        style={{
          position: "absolute",
          top: 124,
          right: 14,
          width: 360,
          bottom: 14,
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>
            Activity · live
          </span>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.red,
              opacity: Math.sin(frame * 0.4) * 0.4 + 0.6,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            overflow: "hidden",
          }}
        >
          {recentActivities.map((a, i) => {
            const acc = ACCOUNTS.find((x) => x.handle === a.account);
            const ageOpacity = i === 0 ? interpolate(frame - a.at, [0, 8], [0, 1], { extrapolateRight: "clamp" }) : 1;
            const ty = i === 0 ? interpolate(frame - a.at, [0, 8], [-6, 0], { extrapolateRight: "clamp" }) : 0;
            const isFollowerEvent = a.text.startsWith("+");
            const isPostEvent = a.text.startsWith("posted");
            return (
              <div
                key={`${a.at}-${a.account}-${i}`}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  opacity: ageOpacity,
                  transform: `translateY(${ty}px)`,
                  padding: "6px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: acc?.avatarColor || C.textVeryDim,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {acc?.initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                    <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>
                      {a.account}
                    </span>
                    <span style={{ color: C.textVeryDim, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                      {Math.floor((frame - a.at) / 30)}s ago
                    </span>
                  </div>
                  <div
                    style={{
                      color: isFollowerEvent ? C.green : isPostEvent ? C.link : C.textMuted,
                      fontSize: 11,
                      marginTop: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontFamily: a.text.includes("POST /") ? "'JetBrains Mono', monospace" : undefined,
                    }}
                  >
                    {a.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StatusBadge: React.FC<{ status: Status; frame: number }> = ({ status, frame }) => {
  const conf: Record<
    Status,
    { label: string; color: string; bg: string; pulse?: boolean }
  > = {
    idle:      { label: "idle",      color: "#71767b", bg: "#1c1f23" },
    drafting:  { label: "drafting",  color: "#ffd400", bg: "#332a00", pulse: true },
    posting:   { label: "posting",   color: "#1d9bf0", bg: "#001f3a", pulse: true },
    posted:    { label: "posted",    color: "#00ba7c", bg: "#002b1c" },
    analyzing: { label: "analyzing", color: "#a78bfa", bg: "#1f1633", pulse: true },
  };
  const c = conf[status];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        background: c.bg,
        border: `1px solid ${c.color}66`,
        borderRadius: 4,
        color: c.color,
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: c.color,
          opacity: c.pulse ? Math.sin(frame * 0.3) * 0.4 + 0.6 : 1,
        }}
      />
      <span>{c.label}</span>
    </div>
  );
};

// X風エンゲージメントアイコン + 数値
const EngStat: React.FC<{
  kind: "reply" | "repost" | "like" | "view" | "bm";
  value: string;
}> = ({ kind, value }) => {
  const icons: Record<string, React.ReactNode> = {
    reply: (
      <path d="M3 6a3 3 0 013-3h12a3 3 0 013 3v7a3 3 0 01-3 3H10l-5 4v-4H6a3 3 0 01-3-3z" />
    ),
    repost: (
      <path d="M4 8l3-3 3 3M7 5v8a2 2 0 002 2h6M20 16l-3 3-3-3M17 19v-8a2 2 0 00-2-2H9" />
    ),
    like: (
      <path d="M12 20S4 15 4 9.5A3.5 3.5 0 0112 6a3.5 3.5 0 018 3.5C20 15 12 20 12 20z" />
    ),
    view: <path d="M4 20V11M10 20V4M16 20v-6M22 20V8" />,
    bm: <path d="M6 3h12v18l-6-4-6 4z" />,
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icons[kind]}
      </svg>
      <span>{value}</span>
    </span>
  );
};
