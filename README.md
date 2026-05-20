# x-bait-videos

X (Twitter) 釣り投稿用の「自動化で動いてる感」動画を作る3アプローチ統合パッケージ。

```
x-bait-videos/
├── remotion/          # 完全プログラマブル動画 (1080×1920縦)
├── terminalizer/      # ターミナル風GIF/MP4 (YAML編集だけで作れる)
└── recording-guide/   # 実SaaS画面の録画ガイド + DevTools演出スニペット
```

> **設計方針:** 派手にしすぎない。実際のSaaS / CIログ / Linearトーストに寄せた静かな見た目のほうが「これマジで動いてる…」と見る人を騙せる。キラキラエフェクトは作り物っぽくなるので入れない。

---

## どれを使うか

| ニーズ | 使うパターン |
|---|---|
| 量産したい / 毎日違う数字を流したい | Remotion |
| エージェント実行ログを格好良く見せたい | terminalizer |
| 本物っぽさ最強で釣りたい | recording-guide (実画面録画) |
| 迷ったらこれ | recording-guide → 慣れたらRemotion併用 |

釣り効果としては **実画面録画 >>> Remotion ≧ terminalizer** だが、量産効率は逆順。

---

## 1. Remotion (プログラマブル動画)

React で動画を書ける。n8n / Make / Zapier 風のワークフローノードを並べて、実行されてる様子を見せる。背景は意図的にフラット (`#0b0d12` + ドットグリッド) で、本物のSaaS管理画面と区別がつかない。

```bash
cd remotion
npm install
npm run dev                  # Remotion Studio → http://localhost:3000
npm run build:workflow       # WorkflowCanvasBait → out/workflow.mp4
```

### カスタマイズ

- `remotion/src/compositions/WorkflowCanvasBait.tsx` — ノードの配置・実行順を編集
- `remotion/src/components/WorkflowNode.tsx` — ノードの見た目 (現状: n8n 風のフラットカード)
- `remotion/src/components/CinematicBackground.tsx` — 背景 (現状: ドットグリッド + 微弱グラデのみ)

### ノードに使えるアイコン

`schedule / http / claude / openai / gemini / vector / x / threads / instagram / note / tiktok / linkedin / youtube / slack / discord / supabase / redis / analytics / code / merge / split / webhook / filter / translate`

---

## 2. terminalizer (ターミナル動画)

YAMLを書き換えるだけでターミナル風のGIF/MP4が作れる。録画不要。GitHub Actions / Cloud Run のログのような無機質な見た目に寄せている (タイムスタンプ・ログレベル・構造化フィールド・rate limit warning入り)。

### 初回セットアップ

```powershell
npm install -g terminalizer
# または プロジェクト内
cd terminalizer
npm install
```

### 使い方

```powershell
cd terminalizer
terminalizer render fake-agent.yml -o ../out/fake-agent.gif
terminalizer render multi-agent.yml -o ../out/multi-agent.gif
```

### サンプル一覧

| ファイル | 内容 |
|---|---|
| `fake-agent.yml` | 単体エージェント: trending → claude生成 → X投稿 → 次の予約 |
| `multi-agent.yml` | 8エージェント並列、rate limit warning入りで本物っぽさUP |

新しい動画を作るときは `records` 配列をコピペして編集するだけ。「派手な進捗バーや絵文字を入れない」ことが本物っぽさのコツ。

---

## 3. recording-guide (実画面録画)

実際の SaaS (threads-auto-post / note-auto / mytrack 等) の管理画面を録画する手法。**一番釣れる**。

詳細は `recording-guide/README.md` 参照。

### 最速セットアップ

1. OBS Studio 入れる
2. キャンバスを 1080×1920 (縦) に設定
3. ブラウザを縦長ウィンドウにして対象SaaSを開く
4. `recording-guide/fake-numbers.js` を DevTools コンソールに貼って数字を盛る
5. 録画 → CapCutで倍速&テロップ&効果音
6. X投稿

### 演出スニペット

`recording-guide/fake-numbers.js` の関数:

- `setStat(selector, value)` — 数字を一発書き換え
- `countUp(selector, from, to, ms)` — カウントアップアニメ (easeOutCubic)
- `showFakeToast(msg, duration, { sub })` — Linear風の地味なトースト + サブ行に `tweet_id=...` など本物っぽいID
- `fakeBurst()` — 連続トースト (一気に複数完了演出、各SaaS別のメッセージ入り)
- `progressOn(selector, ratio)` — 任意要素の下に細い進捗バーを差し込む

---

## 投稿テンプレ (X)

```
寝てる間にこれが全部勝手に動いてるんだけど

[動画]

返信に作り方
```

```
Claude Codeで作った
「全部自動で投稿するやつ」

寝てる間に動いてる

[動画]

リプで配布
```

```
X、Threads、note、Instagram、TikTok
全部自動で投稿される仕組み作った

8体のAIが並列で動いてる

[動画]
```

---

## 量産パイプライン

```
週1で 5-10本の素材撮影/生成
    ↓
CapCutで縦切り抜き × 各4本
    ↓
合計 20-40本の投稿素材ストック
    ↓
毎日2-3本投稿 (時間帯バラす)
    ↓
反応見て勝ちパターン見極め → そのパターンで量産
```

---

## 注意点

- **個人情報・顧客データを絶対映さない** (souken / juku-report は特に)
- **本物のAPIキー・トークン・メアドが画面に出てないか** 投稿前に必ず確認
- **倍速にしすぎるとログが読めなくなる** → 1.5-2倍が映え + 視認性のバランス◎
- **音量はBGM控えめ、効果音メイン** が映え動画の定石
- **派手な演出は逆効果** → グロー・キラキラ・大量の絵文字は素人ほど「作り物」と気づく。本物のCI/SaaSログの無機質さを真似たほうが釣れる
