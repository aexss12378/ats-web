// src/environments/environment.prod.ts

export const environment = {
  production: true,
  apiUrl: '/api', // 預設 API URL，所有請求通過 nginx 路由

  // 微服務端點配置 - 使用相對路徑通過 nginx 路由
  services: {
    // 工作職位管理服務 - 路由到 /api/jobs
    jobService: '/api',

    // 應徵者管理服務 - 路由到 /api/applicants
    applicantService: '/api',

    // 追蹤應徵者服務 - 路由到 /api/trackedApplicants
    trackedApplicantService: '/api',

    // 面試管理服務 - 路由到 /api/interviewers, /api/interviewSessions, /api/feedbacks
    interviewService: '/api',

    // 流程管理服務 - 路由到 /api/processes
    processService: '/api',

    // 主管決策服務 - 路由到 /api/supervisor-comments, /api/supervisor-decisions
    supervisorService: '/api'
  },

  // 微服務實際部署 URL（供 nginx 路由使用）
  microserviceUrls: {
    jobService: 'https://job-service-532457043033.asia-east1.run.app',
    applicantService: 'https://applicant-service-532457043033.asia-east1.run.app',
    trackedApplicantService: 'https://tracked-applicant-service-532457043033.asia-east1.run.app',
    interviewService: 'https://interview-service-532457043033.asia-east1.run.app',
    processService: 'https://process-service-532457043033.asia-east1.run.app',
    supervisorService: 'https://supervisor-service-xxxxxx.asia-east1.run.app'
  }
};
