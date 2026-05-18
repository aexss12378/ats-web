import { StepOutcome, TaskStatus } from './process.model';

// 此為HR初審後的應聘者資料結構（已進入ATS系統追蹤的申請者）
export interface TrackedApplicant {
  applicantId: number;  // 改為 applicantId
  applicantName: string;
  jobId: number;  // 新增 jobId
  jobTitle: string;
  sentTime: string;
  initialReviewStatus: string;
  taskStatus?: TaskStatus;
  processStepId: number;
  stepStatus: StepOutcome;
  interviewSessionId: string;

  // 這些欄位可能需要從其他 API 獲取或設為可選
  supervisor?: string;
  supervisorConfirmed?: boolean;
  englishScore?: number | null;
  logicScore?: number | null;
  codingScore?: number | null;
}
