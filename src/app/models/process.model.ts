// 每個步驟會有各自的狀態，分別為進行中、通過、拒絕
export type StepOutcome = '進行中' | '通過' | '拒絕';
export type TaskStatus = '待主管回覆' | '已提醒' | '已逾期' | '待寄面試邀請' | '已寄面試邀請' | '已完成';

// 此為流程步驟的資料結構
export interface ProcessStep {
  id: number; // 就是以前的currentStep
  label: string;
  possibleOutcomes: StepOutcome[];
}
