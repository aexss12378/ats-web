# 微服務 URL 配置說明

此文件說明如何為 ATS 前端應用程式配置不同的微服務後端 URL。

## 環境配置檔案

### 開發環境 (`src/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: '/api', // 預設 API URL (可作為 fallback)
  
  services: {
    jobService: 'https://job-service-532457043033.asia-east1.run.app/api',
    applicantService: 'https://applicant-service-xxxxxx.asia-east1.run.app/api',
    interviewService: 'https://interview-service-xxxxxx.asia-east1.run.app/api',
    processService: 'https://process-service-xxxxxx.asia-east1.run.app/api',
    supervisorService: 'https://supervisor-service-xxxxxx.asia-east1.run.app/api'
  }
};
```

### 生產環境 (`src/environments/environment.prod.ts`)
生產環境的配置與開發環境相同，只是 `production` 設為 `true`。

## 微服務說明

| 服務名稱 | 功能描述 | 狀態 |
|---------|---------|------|
| **Job Service** | 工作職位管理 - 職位發布、編輯、查詢 | ✅ 已完成 |
| **Applicant Service** | 應徵者管理 - 履歷管理、應徵者資料 | 🔧 開發中 |
| **Interview Service** | 面試管理 - 面試排程、記錄、評分 | 🔧 開發中 |
| **Process Service** | 流程管理 - 招聘流程步驟、狀態管理 | 🔧 開發中 |
| **Supervisor Service** | 主管決策 - 審核、決策、批准 | 🔧 開發中 |

## 如何更新 URL

1. **取得新的微服務 URL**: 當您部署新的微服務到 Google Cloud Run 時，會得到一個新的 URL。

2. **更新環境配置**: 將 `xxxxxx` 替換為您實際的 Cloud Run 服務 ID。

   例如，如果您的 applicant-service 的 URL 是：
   ```
   https://applicant-service-123456789012.asia-east1.run.app
   ```
   
   則更新為：
   ```typescript
   applicantService: 'https://applicant-service-123456789012.asia-east1.run.app/api'
   ```

3. **重建應用程式**: 更新環境變數後需要重新建置應用程式。

## 服務對應關係

- `JobService` → `environment.services.jobService`
- `ApplicantService` → `environment.services.applicantService`
- `InterviewService` → `environment.services.interviewService`
- `ProcessService` → `environment.services.processService`
- `SupervisorService` → `environment.services.supervisorService`

## 開發建議

1. **本地開發**: 可以將某些服務指向本地端點 (如 `http://localhost:3000/api`) 進行開發。

2. **分階段部署**: 可以讓某些服務指向開發環境，某些指向生產環境，方便測試。

3. **健康檢查**: 建議在每個微服務都加入健康檢查端點，以便前端檢查服務狀態。

4. **錯誤處理**: 確保前端服務有適當的錯誤處理機制，當某個微服務無法使用時能夠優雅地降級。
