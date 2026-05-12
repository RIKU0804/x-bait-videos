// ブラウザDevToolsで実行する用のスニペット集
// 録画中に数字を盛ったり、カウントアップを演出するためのもの
//
// ⚠️ 本番DBには絶対書き込まない。あくまでDOM上の見せかけだけ。

// =====================================
// 1) DOMの数字を一発で書き換え
// =====================================
// 例: フォロワー数を1247に書き換え
//   $$('[data-stat="followers"]').forEach(el => el.textContent = '1,247');

const setStat = (selector, value) => {
  document.querySelectorAll(selector).forEach(el => {
    el.textContent = typeof value === 'number' ? value.toLocaleString() : value;
  });
};

// =====================================
// 2) カウントアップアニメーション
// =====================================
// 例: countUp('.followers', 0, 1247, 3000)
//   3秒かけて 0 → 1,247 に増えるアニメ

function countUp(selector, from, to, durationMs = 2000) {
  const el = document.querySelector(selector);
  if (!el) return console.warn(`Not found: ${selector}`);
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / durationMs, 1);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    const val = Math.floor(from + (to - from) * eased);
    el.textContent = val.toLocaleString();
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// =====================================
// 3) 「投稿成功」トースト演出
// =====================================
function showFakeToast(message = '✓ 投稿完了', duration = 2500) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 32px;
    right: 32px;
    background: #1f2937;
    color: #4ade80;
    padding: 16px 24px;
    border-radius: 12px;
    font-family: system-ui;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    border: 1px solid #4ade8040;
    z-index: 99999;
    animation: slideIn 0.3s ease-out;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// =====================================
// 4) 自動連打 (投稿が次々完了する演出)
// =====================================
async function fakeBurst() {
  const messages = [
    '✓ X投稿完了',
    '✓ Threads投稿完了',
    '✓ note記事公開',
    '✓ Instagram予約',
    '✓ TikTok字幕生成',
    '✓ 自動DM 47件送信',
  ];
  for (const msg of messages) {
    showFakeToast(msg);
    await new Promise(r => setTimeout(r, 600));
  }
}

// =====================================
// 使い方
// =====================================
// DevToolsコンソールで:
//   setStat('[data-stat="followers"]', 1247);
//   countUp('.metric-value', 0, 487000, 4000);
//   showFakeToast('✓ 自動投稿完了');
//   fakeBurst();
