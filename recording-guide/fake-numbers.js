// fake-numbers.js — ブラウザDevToolsで実行する用のスニペット集
// 録画中に数字を盛ったり、カウントアップを演出するためのもの
//
// ⚠️ 本番DBには絶対書き込まない。あくまでDOM上の見せかけだけ。
// ⚠️ Linear / Vercel / Stripe のトーストに寄せた地味な見た目。
//    派手にすると逆に作り物っぽくなる。

// =====================================================
// ベースのスタイル注入 (初回だけ)
// =====================================================
(function injectFakeStyles() {
  if (document.getElementById("__fake-numbers-styles")) return;
  const style = document.createElement("style");
  style.id = "__fake-numbers-styles";
  style.textContent = `
    @keyframes fakeSlideIn {
      from { transform: translateY(8px); opacity: 0; }
      to   { transform: translateY(0);   opacity: 1; }
    }
    @keyframes fakeSlideOut {
      from { transform: translateY(0);    opacity: 1; }
      to   { transform: translateY(-4px); opacity: 0; }
    }

    .__fake-toast-wrap {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    }
    .__fake-toast {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 240px;
      padding: 10px 14px;
      border-radius: 8px;
      background: #1a1d24;
      border: 1px solid rgba(255,255,255,0.08);
      color: #e5e7eb;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0;
      box-shadow: 0 8px 24px rgba(0,0,0,0.32);
      animation: fakeSlideIn 0.18s ease-out;
    }
    .__fake-toast.leaving {
      animation: fakeSlideOut 0.16s ease-in forwards;
    }
    .__fake-toast-check {
      flex-shrink: 0;
      width: 14px;
      height: 14px;
      color: #22c55e;
    }
    .__fake-toast-msg {
      flex: 1;
      white-space: nowrap;
    }
    .__fake-toast-sub {
      color: #6b7280;
      font-size: 11px;
      font-family: "JetBrains Mono", "SF Mono", Consolas, monospace;
    }
  `;
  document.head.appendChild(style);
})();

const __getToastWrap = () => {
  let w = document.querySelector(".__fake-toast-wrap");
  if (!w) {
    w = document.createElement("div");
    w.className = "__fake-toast-wrap";
    document.body.appendChild(w);
  }
  return w;
};

// =====================================================
// 1) DOMの数字を一発で書き換え
// =====================================================
// 例: setStat('[data-stat="followers"]', 1247)
const setStat = (selector, value) => {
  document.querySelectorAll(selector).forEach((el) => {
    el.textContent =
      typeof value === "number" ? value.toLocaleString() : value;
  });
};

// =====================================================
// 2) カウントアップアニメーション
// =====================================================
// 例: countUp('.followers', 0, 1247, 3000)
function countUp(selector, from, to, durationMs = 2000, opts = {}) {
  const el = document.querySelector(selector);
  if (!el) return console.warn(`Not found: ${selector}`);
  const { onComplete, prefix = "", suffix = "" } = opts;

  const start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / durationMs, 1);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    const val = Math.floor(from + (to - from) * eased);
    el.textContent = prefix + val.toLocaleString() + suffix;
    if (t < 1) requestAnimationFrame(tick);
    else onComplete && onComplete();
  };
  requestAnimationFrame(tick);
}

// =====================================================
// 3) トースト — Linear / Vercel 風の地味なやつ
// =====================================================
// 例: showFakeToast('Tweet published', { sub: 'tweet_id=1789247318472' })
function showFakeToast(message = "Done", duration = 2800, opts = {}) {
  const wrap = __getToastWrap();
  const toast = document.createElement("div");
  toast.className = "__fake-toast";

  // チェックマーク (SVG、本物ぽい)
  const check =
    '<svg class="__fake-toast-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3.5 8.5 6.5 11.5 12.5 5"/></svg>';

  const sub = opts.sub
    ? `<div class="__fake-toast-sub">${opts.sub}</div>`
    : "";

  toast.innerHTML =
    check +
    '<div class="__fake-toast-msg"></div>' +
    sub;
  toast.querySelector(".__fake-toast-msg").textContent = message.replace(
    /^✓\s*/,
    ""
  );

  wrap.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("leaving");
    setTimeout(() => toast.remove(), 180);
  }, duration);

  return toast;
}

// =====================================================
// 4) 自動連打 (投稿が次々完了する演出)
// =====================================================
// 各トーストの sub 行には URL / ID らしき文字列を入れて本物感を出す
async function fakeBurst(opts = {}) {
  const items = opts.items || [
    { msg: "Posted to X",            sub: "tweet_id=1789247318472" },
    { msg: "Posted to Threads",      sub: "id=t_pZx9Aq · 3 posts" },
    { msg: "Published to note",      sub: "n8f2x · 2,431 chars" },
    { msg: "Instagram scheduled",    sub: "at 19:00 JST" },
    { msg: "TikTok captions ready",  sub: "captions.srt · 12 segments" },
    { msg: "47 DMs sent",            sub: "avg latency 312ms" },
  ];
  const interval = opts.interval || 700;
  for (const it of items) {
    showFakeToast(it.msg, 2800, { sub: it.sub });
    await new Promise((r) => setTimeout(r, interval));
  }
}

// =====================================================
// 5) 進捗バー差し込み (任意要素の下に細い線を出す)
// =====================================================
// 例: progressOn('.stat-card', 0.85)
function progressOn(selector, ratio, opts = {}) {
  const el = document.querySelector(selector);
  if (!el) return console.warn(`Not found: ${selector}`);
  const color = opts.color || "#22c55e";
  let bar = el.querySelector(".__fake-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "__fake-bar";
    bar.style.cssText = `
      position: relative;
      height: 3px;
      margin-top: 6px;
      background: rgba(255,255,255,0.06);
      border-radius: 2px;
      overflow: hidden;
    `;
    const inner = document.createElement("div");
    inner.style.cssText = `
      position: absolute;
      inset: 0;
      width: 0%;
      background: ${color};
      transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      border-radius: inherit;
    `;
    bar.appendChild(inner);
    el.appendChild(bar);
  }
  requestAnimationFrame(() => {
    bar.firstChild.style.width = Math.min(100, ratio * 100) + "%";
  });
}

// =====================================================
// 使い方
// =====================================================
// DevToolsコンソールで:
//   setStat('[data-stat="followers"]', 1247);
//   countUp('.metric-value', 0, 487000, 4000, { prefix: '¥' });
//   showFakeToast('Tweet published', 2800, { sub: 'tweet_id=1789247318472' });
//   fakeBurst();
//   progressOn('.stat-card', 0.85);
