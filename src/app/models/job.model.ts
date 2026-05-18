export interface Job {
  id?: number;
  jobTitle: string;
  department: string;
  createdDate: Date;
  jobStatus: '招募中' | 'urgent' | '已關閉';
  applicantCount: number;
  applicants?: any[];
  manager: string;
  supervisorId?: string;
  managerNotReplied: number;
  managerReplied: number;
  firstInterview: number;
  jointInterview: number;
  selectionMeeting: number;
  hiredCount: number;
  candidateAppointment: number;
  onBoarding: number;
}
