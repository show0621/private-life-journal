# 私密生活筆記

一個**高度保密**的個人日記、筆記與隨手記 App。可在電腦、手機、平板上使用（PWA 可加到主畫面）。

## 功能

- **日記 / 筆記 / 隨手記** — 三種類型，日記可選心情
- **富文本編輯** — 粗體、斜體、標題、項目符號、引用、連結
- **標籤分類** — 為每則記錄加標籤，列表可篩選
- **深色 / 淺色主題** — 可跟隨系統
- **密碼鎖** — 自訂密碼，AES-256-GCM 加密
- **自動上鎖** — 5 分鐘無操作，或切換 App 時上鎖
- **備份還原** — 加密 JSON 備份
- **雲端同步（可選）** — 上傳仍為加密資料，伺服器無法讀取內容
- **GitHub Pages** — 一鍵部署固定網址

## 開始使用

```bash
cd 生活日記專案
npm install
npm run dev
```

瀏覽器開啟 `http://localhost:5173`。

### 手機 / 平板

1. 部署到 HTTPS 網站（見下方 GitHub Pages）
2. 用 Chrome / Safari 開啟網址
3. 選「加到主畫面」/「安裝 App」

---

## 部署到 GitHub Pages

### 1. 建立 GitHub  repo 並推送

```bash
git init
git add .
git commit -m "init private life journal"
git branch -M main
git remote add origin https://github.com/你的帳號/你的-repo名.git
git push -u origin main
```

### 2. 開啟 GitHub Pages

1. GitHub repo → **Settings** → **Pages**
2. **Build and deployment** → Source 選 **GitHub Actions**
3. 推送 `main` 分支後，Actions 會自動建置部署

固定網址：

`https://你的帳號.github.io/你的-repo名/`

> Workflow 會自動把 `VITE_BASE_PATH` 設為 `/repo名/`，無需手動修改。

---

## 雲端同步（可選）

前端只上傳**已加密**的保險庫。同步金鑰會被 SHA-256 雜湊後當作伺服器端的 ID，請使用夠長、夠隨機的金鑰。

### 部署 Cloudflare Worker 後端

```bash
cd worker
npm install

# 建立 KV namespace
npx wrangler kv namespace create VAULT
# 把輸出的 id 填入 wrangler.toml 的 REPLACE_WITH_YOUR_KV_NAMESPACE_ID

npm run deploy
```

部署完成後會得到網址，例如：

`https://life-journal-sync.你的帳號.workers.dev`

### 在 App 中設定

1. 設定 → **雲端同步**
2. **同步 API 網址**：填入 Worker 網址
3. **同步金鑰**：自訂一組（所有裝置需相同）
4. 勾選「啟用雲端同步」→ 儲存
5. 按「立即同步」或開啟「儲存時自動同步」

### API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/health` | 健康檢查 |
| GET | `/vault` | 下載加密保險庫（Header: `X-Sync-Key`） |
| PUT | `/vault` | 上傳加密保險庫 |

---

## 跨裝置方式比較

| 方式 | 優點 | 適合 |
|------|------|------|
| 匯出 / 匯入備份 | 最安全、不需伺服器 | 偶爾換裝置 |
| 雲端同步 | 自動、即時 | 多裝置日常使用 |

> 若忘記**解鎖密碼**，無法復原資料。若忘記**同步金鑰**，仍可用備份檔還原，但雲端上的加密資料無法對應到新金鑰。

---

## 建置正式版

```bash
npm run build
npm run preview
```

本地預覽 GitHub Pages 路徑（repo 名為 `life-journal` 時）：

```bash
# Windows PowerShell
$env:VITE_BASE_PATH="/life-journal/"; npm run build; npm run preview
```

---

## 安全說明

- 解鎖密碼經 PBKDF2（250,000 次）衍生金鑰
- 內容以 AES-GCM 加密後存入 IndexedDB
- 雲端同步上傳的是**同一份加密保險庫**，Worker 只存 blob
- 明文不會離開你的裝置（除非你自己匯出備份）

## 技術

- Vite + TypeScript + PWA
- Web Crypto API + IndexedDB
- Cloudflare Worker + KV（可選同步後端）
- GitHub Actions → GitHub Pages
