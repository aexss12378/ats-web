// 此為應聘者投遞履歷時的原始資料結構（未經篩選的履歷申請）
export interface Applicant {
  id: string;
  name: string;
  education: string;
  experience: number;
  previousCompany: string;
  appliedDate: string;
  resumeUrl?: string;
  // 可選欄位，用於應聘者篩選和處理
  skills?: string[];
  processStepId?: number;
}
