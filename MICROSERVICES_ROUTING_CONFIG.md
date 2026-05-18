# ATS 微服務路由配置

## 概述
本文檔說明 ATS (Applicant Tracking System) 的 nginx 路由配置，將不同的 API 請```typescript
services: {
  jobService: 'https://job-service-532457043033.asia-east1.run.app/api',
  applicantService: 'https://applicant-service-532457043033.asia-east1.run.app/api',
  trackedApplicantService: 'https://tracked-applicant-service-532457043033.asia-east1.run.app/api',
  interviewService: 'https://interview-service-532457043033.asia-east1.run.app/api',
  processService: 'https://process-service-532457043033.asia-east1.run.app/api',
  supervisorService: 'https://supervisor-service-xxxxxx.asia-east1.run.app/api'
}
```應的微服務。

## 微服務架構

### 已部署的服務
- ✅ **Job Service**: `https://job-service-532457043033.asia-east1.run.app`
  - 狀態: 已部署且運行中
  - 功能: 職位管理

### 待部署的服務
- 🔧 **Applicant Service**: `https://applicant-service-532457043033.asia-east1.run.app`
  - 狀態: 需要部署
  - 功能: 應聘者基本資料管理

- 🔧 **Tracked Applicant Service**: `https://tracked-applicant-service-532457043033.asia-east1.run.app`
  - 狀態: 需要部署
  - 功能: 已進入 ATS 系統的應聘者追蹤管理

- 🔧 **Interview Service**: `https://interview-service-532457043033.asia-east1.run.app`
  - 狀態: 需要部署
  - 功能: 面試官管理、面試安排、面試回饋

- 🔧 **Process Service**: `https://process-service-532457043033.asia-east1.run.app`
  - 狀態: 需要部署
  - 功能: 招聘流程管理

- 🔧 **Supervisor Service**: `https://supervisor-service-xxxxxx.asia-east1.run.app`
  - 狀態: 需要部署
  - 功能: 主管決策 (目前整合在 Interview Service)

## API 路由規則

### Job Service 路由
- **路徑**: `/api/jobs`
- **目標**: `https://job-service-532457043033.asia-east1.run.app`
- **用途**: 所有職位相關的 API 請求

### Applicant Service 路由
- **路徑**: `/api/applicants`
- **目標**: `https://applicant-service-532457043033.asia-east1.run.app`
- **用途**: 應聘者基本資料管理

### Tracked Applicant Service 路由
- **路徑**: `/api/trackedApplicants`
- **目標**: `https://tracked-applicant-service-532457043033.asia-east1.run.app`
- **用途**: 已進入 ATS 系統的應聘者追蹤管理

### Interview Service 路由
- **路徑**: `/api/interviewers`
- **目標**: `https://interview-service-532457043033.asia-east1.run.app`
- **用途**: 面試官管理

- **路徑**: `/api/interviewSessions`
- **目標**: `https://interview-service-532457043033.asia-east1.run.app`
- **用途**: 面試安排和管理

- **路徑**: `/api/feedbacks`
- **目標**: `https://interview-service-532457043033.asia-east1.run.app`
- **用途**: 面試回饋管理

### Supervisor Service 路由 (暫時整合在 Interview Service)
- **路徑**: `/api/supervisor-comments`
- **目標**: `https://interview-service-532457043033.asia-east1.run.app`
- **用途**: 主管評論

- **路徑**: `/api/supervisor-decisions`
- **目標**: `https://interview-service-532457043033.asia-east1.run.app`
- **用途**: 主管決策

## 配置文件

### 1. nginx.conf
靜態配置文件，定義了所有微服務的路由規則。

### 2. entrypoint.sh
動態 nginx 配置生成器，包含：
- Google Cloud 認證
- JWT Token 自動更新 (每 45 分鐘)
- 動態生成包含認證 header 的 nginx 配置

### 3. environment.ts
Angular 環境配置，定義各微服務的端點：
```typescript
services: {
  jobService: 'https://job-service-532457043033.asia-east1.run.app/api',
  applicantService: 'https://applicant-service-532457043033.asia-east1.run.app/api',
  trackedApplicantService: 'https://tracked-applicant-service-532457043033.asia-east1.run.app/api',
  interviewService: 'https://interview-service-532457043033.asia-east1.run.app/api',
  processService: 'https://process-service-532457043033.asia-east1.run.app/api',
  supervisorService: 'https://supervisor-service-xxxxxx.asia-east1.run.app/api'
}
```

## Angular Services 配置

### ✅ 已正確配置的服務
- **JobService**: 使用 `environment.services.jobService`
- **ApplicantService**: 使用 `environment.services.applicantService`
- **InterviewService**: 使用 `environment.services.interviewService`
- **ProcessService**: 使用 `environment.services.processService`

### ✅ 特殊配置的服務
- **TrackedApplicantService**: 使用 `environment.apiUrl` (透過 nginx 路由 `/api/trackedApplicants` 到 tracked-applicant-service)

## CORS 配置
所有路由都包含完整的 CORS 配置：
- 支援所有來源 (`*`)
- 支援所有 HTTP 方法
- 支援自訂 headers
- 處理 preflight 請求

## 下一步行動

### 1. 部署 Applicant Service
```bash
# 部署應聘者基本資料服務到 Cloud Run
gcloud run deploy applicant-service \
  --source ./applicant-service \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated
```

### 2. 部署 Tracked Applicant Service
```bash
# 部署應聘者追蹤服務到 Cloud Run
gcloud run deploy tracked-applicant-service \
  --source ./tracked-applicant-service \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated
```

### 3. 部署 Interview Service
```bash
# 部署面試服務到 Cloud Run
gcloud run deploy interview-service \
  --source ./interview-service \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated
```

### 3. 部署 Interview Service
```bash
# 部署面試服務到 Cloud Run
gcloud run deploy interview-service \
  --source ./interview-service \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated
```

### 4. 部署 Process Service
```bash
# 部署流程服務到 Cloud Run
gcloud run deploy process-service \
  --source ./process-service \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated
```

### 5. 測試路由
部署完成後，測試各個路由是否正確工作：
- `/api/jobs` → Job Service ✅ (已部署)
- `/api/applicants` → Applicant Service
- `/api/trackedApplicants` → Tracked Applicant Service
- `/api/interviewers` → Interview Service
- `/api/interviewSessions` → Interview Service
- `/api/feedbacks` → Interview Service

## 故障排除

### 檢查路由配置
```bash
# 檢查 nginx 配置
nginx -t

# 查看 nginx 日誌
tail -f /var/log/nginx/error.log
```

### 檢查服務連接
```bash
# 測試服務連接
curl -X GET https://your-frontend-url/api/jobs
curl -X GET https://your-frontend-url/api/applicants
```

### 檢查認證
確保 JWT Token 正確設置並定期更新。

## 備註
- entrypoint.sh 會覆蓋 nginx.conf 的內容
- 所有微服務配置更改都應該在 entrypoint.sh 中進行
- 確保 Cloud Run 服務 URL 正確且服務已部署
