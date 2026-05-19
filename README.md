# ats-web

ATS 前端專案，使用 Angular 19、PrimeNG 與 Tailwind CSS。這個 repo 只負責前端畫面、前端路由、API 呼叫與 mock data；後端服務與雲端平台設定不放在這裡維護。

## 技術棧

| 項目 | 版本 |
|------|------|
| Angular | 19.2.1 |
| PrimeNG | 19.0.10 |
| Tailwind CSS | 4.1.4 |
| Node.js | 18+ |

## 本地開發

```bash
npm install
npm start
```

前端預設會開在：

```text
http://127.0.0.1:4200
```

如果要用本機 mock data，另外開一個終端機執行：

```bash
npm run mock-api
```

mock API 預設會開在：

```text
http://127.0.0.1:3001
```

## 常用指令

```bash
npm start      # 啟動本地前端
npm run build  # 建置正式版前端
npm run mock-api
```

型別檢查可以用：

```bash
./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
```

## 資料來源

本地開發時，demo 資料主要來自 `db.json`，透過 `json-server` 模擬 API。

正式環境時，前端會透過相對路徑呼叫 API，例如：

```text
/api/jobs
/api/applicants
/api/trackedApplicants
```

因此前端程式不需要知道後端服務的實際部署網址；這層由正式環境的反向代理與平台設定處理。

## 登入狀態

舊版曾使用 Google 登入作為進入系統的 gate。目前 demo 階段已暫停這個檢查，進入正式站會直接顯示 ATS 系統頁面。

如果未來要恢復 Google 登入，需要重新整理 OAuth 設定與前端登入流程。

## 專案結構

```text
src/app/pages       主要頁面
src/app/services    API 呼叫服務
src/app/models      前端資料模型
src/app/config      前端 API 設定
db.json             本地 demo 資料
nginx.conf          正式環境前端反向代理設定
```

## Git 流程

日常開發從 `develop` 開分支，完成後開 PR 回 `develop`。

commit 訊息使用 Conventional Commits，例如：

```text
fix: 修正前端代理設定
docs: 更新前端 README
```
