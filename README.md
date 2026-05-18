
# ATS (Applicant Tracking System) Frontend

一個基於 Angular 19 的現代化人才招聘管理系統前端應用，採用微服務架構設計，部署於 Google Cloud Run 平台。

## 🚀 技術架構

### 前端技術棧
- **Framework**: Angular 19.2.1 (Standalone Components)
- **Architecture Pattern**: MVC + Component-Based Architecture
- **UI Library**: PrimeNG - 現代化的 Angular UI 元件庫
- **CSS Framework**: Tailwind CSS + 自訂 CSS
- **Build Tool**: Angular CLI + Webpack
- **Package Manager**: npm

### 後端架構
- **Architecture**: 微服務架構 (Microservices)
- **API Style**: RESTful API
- **Authentication**: JWT Token-based
- **Proxy**: Nginx 反向代理

### 雲端基礎設施
- **Platform**: Google Cloud Run
- **Container**: Docker 多階段構建
- **Authentication**: Google Cloud IAM
- **Monitoring**: Cloud Logging

## 🏗️ 專案資料夾架構

```
src/
├── app/                          # 應用程式核心
│   ├── components/               # 共用元件層 (View)
│   │   ├── header/              # 頁面標頭元件
│   │   ├── navbar/              # 導航列元件
│   │   ├── reviewer-header/     # 審核者標頭元件
│   │   └── tabs/                # 標籤頁元件
│   │
│   ├── pages/                    # 頁面元件層 (View + Controller)
│   │   ├── dashboard/           # 儀表板頁面
│   │   ├── job-upload/          # 職缺建立與履歷上傳
│   │   ├── resume-screening/    # 履歷篩選
│   │   ├── talent-pool/         # 人才庫管理
│   │   │
│   │   ├── supervisor-screen-applicant/  # 主管應聘者篩選
│   │   ├── supervisor-interview/         # 主管面試安排
│   │   ├── supervisor-rating/            # 主管面試評分
│   │   ├── supervisor-decision/          # 主管人選決策
│   │   │
│   │   ├── interviewer-interview/        # 面試官面試管理
│   │   └── interviewer-rating/           # 面試官面試評分
│   │
│   ├── services/                 # 服務層 (Model)
│   │   ├── job.service.ts       # ✅ 職位管理服務 (完整實作)
│   │   ├── applicant.service.ts # ✅ 應聘者基本資料服務
│   │   ├── tracked-applicant.service.ts  # ✅ 應聘者追蹤服務
│   │   ├── interview.service.ts # ✅ 面試管理服務
│   │   ├── process.service.ts   # ✅ 流程管理服務
│   │   └── applicant.service.spec.ts     # 單元測試檔案
│   │
│   ├── models/                   # 資料模型層 (Model)
│   │   ├── job.model.ts         # 職位資料模型
│   │   ├── applicant.model.ts   # 應聘者資料模型
│   │   ├── tracked-applicant.model.ts   # 追蹤應聘者模型
│   │   ├── interview.model.ts   # 面試資料模型
│   │   └── process.model.ts     # 流程資料模型
│   │
│   ├── app.component.*          # 根元件
│   └── app.routes.ts           # 路由配置
│
├── environments/                 # 環境配置
│   └── environment.prod.ts     # 生產環境配置
├── environment.ts              # 開發環境配置
├── main.ts                     # 應用程式入口
└── styles.css                  # 全域樣式
```

## 🏛️ 架構模式

### 1. MVC 架構模式
- **Model (模型層)**:
  - [`services/`](src/app/services/) - 資料服務層，負責與後端 API 通訊
  - [`models/`](src/app/models/) - 資料模型定義，如 [`Job`](src/app/models/job.model.ts), [`Interviewer`](src/app/models/interview.model.ts)

- **View (視圖層)**:
  - [`components/`](src/app/components/) - 共用 UI 元件
  - [`pages/*/component.html`](src/app/pages/) - 頁面模板

- **Controller (控制層)**:
  - [`pages/*/component.ts`](src/app/pages/) - 頁面控制器，處理業務邏輯

### 2. Standalone Components 架構
```typescript
// 範例：supervisor-screen-applicant.component.ts
@Component({
  selector: 'app-supervisor-screen-applicant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    ReviewerHeaderComponent,
    NavbarComponent
  ],
  templateUrl: './supervisor-screen-applicant.component.html',
  styleUrls: ['./supervisor-screen-applicant.component.css']
})
export class SupervisorScreenApplicantComponent {
  // Controller 邏輯
}
```

### 3. 服務注入架構 (JWT Token 認證)
```typescript
// JobService 認證標準範例
private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('gcp_id_token');
  if (!token) {
    throw new Error('未找到認證 token，請重新登入');
  }
  return new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
}

// 依賴注入模式
constructor(
  private jobService: JobService,
  private trackedApplicantService: TrackedApplicantService
) {}
```

## 🛠️ 服務層架構 (完整實作)

### 認證機制標準化
所有服務都使用相同的 JWT Token 認證模式：

```typescript
// 標準認證方法模板
private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('gcp_id_token');
  if (!token) {
    throw new Error('未找到認證 token，請重新登入');
  }
  return new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
}
```

### 實際服務清單

| 服務檔案 | 功能描述 | 主要方法 | 認證 | 狀態 |
|---------|---------|---------|------|------|
| [`job.service.ts`](src/app/services/job.service.ts) | 職位管理 | `getJobs()`, `getOpenJobs()`, `createJob()`, `deleteJob()` | ✅ JWT | ✅ 完整 |
| [`applicant.service.ts`](src/app/services/applicant.service.ts) | 應聘者基本資料 | `getApplicants()`, `getApplicantById()`, `createApplicant()` | ✅ JWT | ✅ 完整 |
| [`tracked-applicant.service.ts`](src/app/services/tracked-applicant.service.ts) | 應聘者追蹤管理 | `getTrackedApplicants()`, `updateStatus()`, `updateProcess()` | ✅ JWT | ✅ 完整 |
| [`interview.service.ts`](src/app/services/interview.service.ts) | 面試管理 | `getInterviewers()`, `getInterviewSessions()`, `saveScore()` | ✅ JWT | ✅ 完整 |
| [`process.service.ts`](src/app/services/process.service.ts) | 流程管理 | `getSteps()`, `getStepItems()`, `getStepLabelById()` | ✅ JWT | ✅ 完整 |

### 服務實作範例

#### JobService 核心功能
```typescript
// 職位管理服務的主要方法
getJobs(): Observable<Job[]>                    // 取得所有職缺
getOpenJobs(): Observable<Job[]>                // 取得開啟中職缺  
createJob(jobTitle: string): Observable<Job>    // 建立新職缺
deleteJob(id: number): Observable<void>         // 刪除職缺
```

#### 微服務路由設計
- **API URL**: `environment.apiUrl` (`/api`)
- **Nginx 路由**: `/api/jobs` → `job-service`
- **認證方式**: Bearer Token (Google Cloud IAM)

## 📊 微服務架構

### 前端服務層 (已完成)
| 服務名稱 | 功能描述 | API 端點 | 認證 | 狀態 |
|---------|---------|---------|------|------|
| [`JobService`](src/app/services/job.service.ts) | 職位管理 | `/api/jobs` | JWT Token | ✅ 已完成 |
| [`ApplicantService`](src/app/services/applicant.service.ts) | 應聘者基本資料 | `/api/applicants` | JWT Token | ✅ 已完成 |
| [`TrackedApplicantService`](src/app/services/tracked-applicant.service.ts) | 應聘者追蹤管理 | `/api/trackedApplicants` | JWT Token | ✅ 已完成 |
| [`InterviewService`](src/app/services/interview.service.ts) | 面試管理 | `/api/interviewers`, `/api/interviewSessions`, `/api/feedbacks` | JWT Token | ✅ 已完成 |
| [`ProcessService`](src/app/services/process.service.ts) | 流程管理 | `/api/processes` | JWT Token | ✅ 已完成 |

### 後端微服務部署狀態
| 後端服務 | Google Cloud Run 狀態 | 前端對接 | 備註 |
|---------|---------------------|---------|------|
| Job Service | ✅ 已部署 | ✅ 完成 | 職位管理功能正常 |
| Tracked Applicant Service | ✅ 已部署 | ✅ 完成 | 追蹤功能正常 |
| Applicant Service | 🔧 待部署 | ✅ 前端就緒 | 等待後端部署 |
| Interview Service | 🔧 待部署 | ✅ 前端就緒 | 等待後端部署 |
| Process Service | 🔧 待部署 | ✅ 前端就緒 | 等待後端部署 |

## 🌟 功能模組架構

### 1. 人力資源管理模組
- [`job-upload/`](src/app/pages/job-upload/) - 職缺建立與履歷上傳
- [`resume-screening/`](src/app/pages/resume-screening/) - 履歷篩選
- [`talent-pool/`](src/app/pages/talent-pool/) - 人才庫管理

### 2. 主管功能模組
- [`supervisor-screen-applicant/`](src/app/pages/supervisor-screen-applicant/) - 應聘者篩選
- [`supervisor-interview/`](src/app/pages/supervisor-interview/) - 面試安排
- [`supervisor-rating/`](src/app/pages/supervisor-rating/) - 面試評分
- [`supervisor-decision/`](src/app/pages/supervisor-decision/) - 人選決策

### 3. 面試官功能模組
- [`interviewer-interview/`](src/app/pages/interviewer-interview/) - 面試管理
- [`interviewer-rating/`](src/app/pages/interviewer-rating/) - 面試評分

### 4. 共用元件模組
- [`navbar/`](src/app/components/navbar/) - 導航列
- [`reviewer-header/`](src/app/components/reviewer-header/) - 頁面標頭
- [`tabs/`](src/app/components/tabs/) - 標籤頁

## 🛠️ 開發架構模式

### Reactive Programming
- 使用 RxJS Observable 處理非同步資料流
- forkJoin 合併多個 API 請求

```typescript
// 範例：同時載入多個資料源
forkJoin({
  sessions: this.interviewService.getInterviewSessions(),
  jobs: this.jobService.getJobs(),
  tracked: this.trackedApplicantService.getTrackedApplicants()
}).subscribe({
  next: (data) => {
    // 處理合併後的資料
  }
});
```

### 依賴注入模式
```typescript
// 服務注入到元件
constructor(
  private jobService: JobService,
  private messageService: MessageService
) {}
```

### 環境配置管理
- [`environment.ts`](src/environment.ts) - 開發環境
- [`environment.prod.ts`](src/environments/environment.prod.ts) - 生產環境

```typescript
export const environment = {
  production: false,
  apiUrl: '/api',
  services: {
    jobService: '/api',
    applicantService: '/api',
    interviewService: '/api'
  }
};
```

## 🐳 部署架構

### Docker 多階段構建
- [`Dockerfile`](Dockerfile) - 容器化配置
- [`entrypoint.sh`](entrypoint.sh) - 動態 Nginx 配置
- [`nginx.conf`](nginx.conf) - 反向代理配置

### 微服務路由架構
詳見 [`MICROSERVICES_ROUTING_CONFIG.md`](MICROSERVICES_ROUTING_CONFIG.md)

## 🔧 配置檔案架構

```
配置檔案/
├── angular.json              # Angular CLI 配置
├── package.json              # 專案依賴與腳本
├── tsconfig.json            # TypeScript 編譯配置
├── Dockerfile               # Docker 容器配置
├── nginx.conf               # Nginx 伺服器配置
├── entrypoint.sh           # 容器啟動腳本
├── .gcloudignore           # Google Cloud 部署忽略檔案
└── proxy.conf.json         # 開發環境代理配置
```

## 📱 響應式設計架構

### CSS 架構
- **全域樣式**: [`styles.css`](src/styles.css)
- **元件樣式**: 各元件專屬 CSS 檔案
- **框架整合**: Tailwind CSS + PrimeNG + 自訂樣式

### 媒體查詢結構
```css
/* 響應式斷點 */
@media (max-width: 768px) {
  /* 平板樣式 */
}

@media (max-width: 480px) {
  /* 手機樣式 */
}
```

## 🔒 跨域請求解決方案 (CORS)

### Nginx 反向代理架構
透過 [`nginx.conf`](nginx.conf) 實現統一的 CORS 處理：

```nginx
# 統一 CORS Header 設定
add_header 'Access-Control-Allow-Origin' '*' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;

# 預檢請求處理
if ($request_method = 'OPTIONS') {
    return 204;
}
```

### 微服務路由配置
| 前端路徑 | 後端微服務 | 描述 |
|---------|-----------|------|
| `/api/jobs` | Job Service (Cloud Run) | 職位管理 API |
| `/api/applicants` | Applicant Service | 應聘者資料 API |
| `/api/trackedApplicants` | Tracked Applicant Service | 追蹤管理 API |
| `/api/interviewers` | Interview Service | 面試官 API |
| `/api/interviewSessions` | Interview Service | 面試場次 API |
| `/api/processes` | Process Service | 流程管理 API |

### 跨域解決策略
1. **前端請求統一路徑**: 所有 API 都透過 `/api/*` 路徑
2. **Nginx 反向代理**: 將請求轉發到對應的 Cloud Run 微服務
3. **統一 CORS 處理**: 在 Nginx 層級統一加上 CORS Header
4. **預檢請求優化**: OPTIONS 請求直接回應 204，提高效能

這個架構充分利用了 Angular 19 的 Standalone Components、依賴注入、反應式程式設計等現代前端開發模式，同時結合微服務後端架構，提供了可擴展、可維護的企業級應用程式架構。
