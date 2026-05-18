export interface Interviewer {
  id: string;
  name: string;
  role: 'interviewer' |'supervisor'; // 面試官角色
  department: string;
  title: string;
  email: string;
}

export interface InterviewSession {
  id: string;
  round: number; // 第幾輪
  scheduledTime: string; // ISO 格式的時間
  location: any;
  interviewerIds: string[]; // 負責這場面試的面試官
  applicantId: string;   // 假設一面是一個應聘者對應三個面試官
  notes?: string; // 面試安排備註
  feedbacks: InterviewerFeedback[]; // 面試官回饋
  feedbackDeadline: string; // 面試官回饋截止時間
  allFeedbacksReceived: boolean;
}

export interface InterviewerFeedback {
  interviewerId: string; // 面試官ID
  comment: string; // 面試官回饋內容
  submitted: boolean; // 是否已提交回饋
  submittedTime?: string; // 提交時間
  waitDays: number; // 等待天數
}

export interface InterviewScoreDTO {
  candidateId: number;
  interviewerId: number;
  scores: { [key: string]: number };
  integrity: string;
  integrityNote: string;
  recommendation: number;
  comment: string;
}

// 用於主管人選評估中提交評語的資料結構
export interface SupervisorComment {
  candidateId: number;
  supervisorId: string;
  decision: 'approve' | 'reject';
  comment: string;
  timestamp: string;
}
