import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { TabsComponent } from '../../components/tabs/tabs.component';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { SplitButtonModule } from 'primeng/splitbutton';
import { StepsModule } from 'primeng/steps';
import { DialogModule } from 'primeng/dialog';
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job.model';
import { TrackedApplicantService } from '../../services/tracked-applicant.service';
import { TrackedApplicant } from '../../models/tracked-applicant.model';
import { TaskStatus } from '../../models/process.model';
import { InterviewService } from '../../services/interview.service';
import { ProcessService } from '../../services/process.service';
import { forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';

type RiskLevel = '高' | '中' | '低';
type CsvCell = string | number | boolean | null | undefined;

interface RecruitmentKpi {
  label: string;
  value: string | number;
  detail: string;
  tone: 'blue' | 'green' | 'amber' | 'slate';
}

interface FunnelStage {
  label: string;
  count: number;
  percent: number;
  previousCount: number;
  conversionRate: number;
  dropOffCount: number;
  insight: string;
}

interface JobReportRow {
  jobTitle: string;
  manager: string;
  applicantCount: number;
  blocker: string;
  blockerReason: string;
  nextAction: string;
  healthLabel: string;
  riskLevel: RiskLevel;
  waitDays: number;
  currentStage: string;
  progressPercent: number;
  conversionRate: number;
  automationTrigger: string;
}

interface FeedbackReportRow {
  name: string;
  position: string;
  interviewDate: string;
  deadline: string;
  submitted: number;
  pending: number;
  waitDays: number;
  dueDays: number;
  waitingNames: string;
  statusLabel: string;
  riskLevel: RiskLevel;
  nextAction: string;
  triggerCondition: string;
}

interface AutomationOpportunity {
  title: string;
  tool: string;
  signal: string;
  trigger: string;
  owner: string;
  impact: string;
  priority: RiskLevel;
  inputData: string;
  outputResult: string;
  sourceField: string;
}

interface RiskItem {
  title: string;
  description: string;
  action: string;
  riskLevel: RiskLevel;
}

interface ExecutiveSummaryItem {
  label: string;
  value: string | number;
  description: string;
  action: string;
  riskLevel: RiskLevel;
}

interface HrKpiItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  detail: string;
  source: string;
  priority: '第一優先' | '第二層' | '第三層';
  tone: 'critical' | 'warning' | 'stable' | 'neutral';
}

interface HrKpiGroup {
  title: string;
  description: string;
  items: HrKpiItem[];
}

interface KpiDrilldownRow {
  primary: string;
  secondary: string;
  owner: string;
  status: string;
  waitDays: number | string;
  sourceField: string;
  action: string;
}

interface TaskQueueItem {
  title: string;
  category: string;
  target: string;
  owner: string;
  priority: RiskLevel;
  waitDays: number | string;
  tool: string;
  sourceField: string;
  action: string;
}

interface PowerAutomateReminderPayload {
  candidateName: string;
  jobTitle: string;
  recipientName: string;
  daysOverdue: number;
  triggerReason: string;
  testRecipientEmail: string;
}

interface PowerAutomateReminderLog extends PowerAutomateReminderPayload {
  id: string;
  createdAt: string;
  status: string;
  escalationOwner: string;
}

interface ActionItem {
  iconClass: string;
  text: string;
  urgency: 'critical' | 'warning' | 'info';
  category: string;
}

interface TrendMetric {
  label: string;
  current: number | string;
  data: { week: string; value: number; percent: number }[];
  changeText: string;
  changeClass: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, TabsComponent, CardModule, TabsModule, TableModule, ButtonModule, StepsModule, SplitButtonModule, MenuModule, DialogModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  openPositionList: Job[] = [];
  trackedApplicantsByJobTitle: { [jobTitle: string]: any[] } = {};
  pendingApplicants: any[] = [];
  approvedApplicants: any[] = [];
  rejectedApplicants: any[] = [];
  interviewees: any[] = [];
  stepItems: { label: string }[] = [];
  pendingReviewCount = 0;
  scheduledInterviewCount = 0;
  pendingFeedbackCount = 0;
  feedbackDialogVisible = false;
  selectedFeedbackApplicant: any = null;
  reportGeneratedAt = new Date();
  exportCsvSections = { kpi: true, jobStatus: true, taskQueue: true, automation: true };
  exportPbiSections = { dimJobs: true, factCandidates: true, factFeedback: true, factAutomation: true };
  selectedReportJobTitle: string | null = null;
  selectedAutomationTitle: string | null = null;
  selectedKpiId: string | null = 'pendingManager';
  powerAutomateDialogVisible = false;
  powerAutomateStatus = '';
  readonly powerAutomateTriggerSubject = '[ATS_DEMO_TRIGGER]';
  readonly powerAutomateTriggerInbox = 'aexss12378@gmail.com';
  powerAutomateRecipientEmail = 'aexss12378@gmail.com';
  selectedPowerAutomateReminder: PowerAutomateReminderPayload | null = null;
  powerAutomateReminderLogs: PowerAutomateReminderLog[] = [];

  isLoading = true;
  error: string | null = null;
  expandedRows: { [key: string]: boolean } = {};
  items: MenuItem[] = [];

  constructor(
    private jobService: JobService,
    private trackedApplicantService: TrackedApplicantService,
    private interviewService: InterviewService,
    private processService: ProcessService
  ) {}

  ngOnInit() {
    this.loadPowerAutomateDemoSettings();
    this.loadPowerAutomateReminderLogs();
    this.loadOpenJobs();
    this.loadTrackedApplicants();
    this.loadInterviewSessions();
    this.loadSteps();
  }

  loadOpenJobs(): void {
    this.jobService.getJobs().subscribe({
      next: (data) => {
        this.openPositionList = data
          .map(job => ({
            ...job,
            jobStatus: job.jobStatus ?? (job as any).status,
            applicantCount: job.applicantCount ?? job.applicants?.length ?? 0,
            managerNotReplied: job.managerNotReplied ?? 0,
            managerReplied: job.managerReplied ?? 0,
            firstInterview: job.firstInterview ?? 0,
            jointInterview: job.jointInterview ?? 0,
            selectionMeeting: job.selectionMeeting ?? 0,
            hiredCount: job.hiredCount ?? 0,
            candidateAppointment: job.candidateAppointment ?? 0,
            onBoarding: job.onBoarding ?? 0
          }))
          .filter(job => job.jobStatus === '招募中');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('取得資料失敗', err);
        this.error = '取得資料失敗';
        this.isLoading = false;
      }
    });
  }

  loadTrackedApplicants() {
    this.trackedApplicantService.getTrackedApplicants().subscribe((trackedApplicants: TrackedApplicant[]) => {
      this.trackedApplicantsByJobTitle = {};
      this.pendingApplicants = [];
      this.approvedApplicants = [];
      this.rejectedApplicants = [];

      trackedApplicants.forEach((applicant: TrackedApplicant) => {
        const jobKey = applicant.jobTitle;
        const reviewStatus = applicant.initialReviewStatus
          ?? (applicant.stepStatus === '拒絕'
            ? 'Rejected'
            : ((applicant as any).status === '主管確認'
              ? 'Passed Initial Screening'
              : 'Pending Review'));
        const taskStatus = this.resolveTaskStatus(applicant, reviewStatus);
        const formattedApplicant = {
          id: (applicant as any).id,
          applicantName: applicant.applicantName,
          jobTitle: applicant.jobTitle,
          supervisor: applicant.supervisor,
          sentTime: applicant.sentTime,
          managerRespondedAt: (applicant as any).managerRespondedAt,
          managerResponseDueAt: (applicant as any).managerResponseDueAt,
          processUpdatedAt: (applicant as any).processUpdatedAt,
          initialReviewStatus: reviewStatus,
          taskStatus,
          englishScore: applicant.englishScore,
          logicScore: applicant.logicScore,
          codingScore: applicant.codingScore,
          note: (applicant as any).note,
          processStepId: applicant.processStepId || 0,
          stepLabel: this.processService.getStepLabelById(applicant.processStepId || 0),
          stepStatus: applicant.stepStatus || '進行中',
          interviewSessionId: applicant.interviewSessionId
        };

        if (!this.trackedApplicantsByJobTitle[jobKey]) {
          this.trackedApplicantsByJobTitle[jobKey] = [];
        }
        this.trackedApplicantsByJobTitle[jobKey].push(formattedApplicant);

        if (reviewStatus === 'Pending Review') {
          this.pendingApplicants.push(formattedApplicant);
        } else if (reviewStatus === 'Passed Initial Screening' && !applicant.interviewSessionId && taskStatus !== '已寄面試邀請') {
          this.approvedApplicants.push(formattedApplicant);
        } else if (reviewStatus === 'Rejected') {
          this.rejectedApplicants.push(formattedApplicant);
        }
      });

      this.pendingReviewCount = this.pendingApplicants.length;
    });
  }

  getStepActiveIndex(applicant: any): number {
    return this.processService.getStepIndexById(Number(applicant.processStepId) || 1);
  }

  getStepItemsWithStatus(applicant: any): any[] {
    const allSteps = this.processService.getSteps();
    const currentStepId = Number(applicant.processStepId) || 0;
    let hasRejected = false;

    return allSteps.map(step => {
      const stepItem = {
        label: step.label,
        styleClass: ''
      };

      if (hasRejected) {
        stepItem.styleClass = 'step-disabled';
        return stepItem;
      }

      if (step.id === currentStepId) {
        if (applicant.stepStatus === '通過') {
          stepItem.styleClass = 'step-passed';
        } else if (applicant.stepStatus === '拒絕') {
          stepItem.styleClass = 'step-rejected';
          hasRejected = true;
        } else {
          stepItem.styleClass = 'step-in-progress';
        }
      } else if (step.id < currentStepId) {
        stepItem.styleClass = 'step-passed';
      }

      return stepItem;
    });
  }

  loadInterviewSessions() {
    this.interviewService.getInterviewSessions().subscribe((sessions) => {
      this.scheduledInterviewCount = sessions.length;
      this.pendingFeedbackCount = sessions.reduce((count, session) =>
        count + (session.feedbacks ?? []).filter(feedback => !feedback.submitted).length,
        0
      );

      const applicantObservables = sessions.map(session => {
        const feedbacks = session.feedbacks ?? [];
        const interviewerList$ = feedbacks.length
          ? forkJoin(feedbacks.map(feedback => this.interviewService.getInterviewerNameById(feedback.interviewerId).pipe(
            map(name => ({
              name,
              status: feedback.submitted ? '已提交' : '未提交',
              waitDays: feedback.waitDays,
              submitted: feedback.submitted,
              comment: feedback.comment
            }))
          )))
          : of([]);

        return forkJoin([
          this.trackedApplicantService.getTrackedApplicantById(session.applicantId),
          interviewerList$
        ]).pipe(
          map(([applicant, interviewers]: [TrackedApplicant | null, any[]]) => ({
            sessionId: session.id,
            name: applicant ? applicant.applicantName : '未知應聘者',
            position: applicant ? applicant.jobTitle : '未知職位',
            interviewDate: session.scheduledTime,
            feedbackDeadline: session.feedbackDeadline,
            allFeedbacksReceived: session.allFeedbacksReceived,
            interviewers
          }))
        );
      });

      if (applicantObservables.length > 0) {
        forkJoin(applicantObservables).subscribe(processedInterviewees => {
          this.interviewees = processedInterviewees;
        });
      } else {
        this.interviewees = [];
      }
    });
  }

  loadSteps() {
    this.stepItems = this.processService.getStepItems();
  }

  viewFeedback(applicant: any) {
    this.selectedFeedbackApplicant = applicant;
    this.feedbackDialogVisible = true;
  }

  openPowerAutomateReminder(row: FeedbackReportRow): void {
    this.selectedPowerAutomateReminder = {
      candidateName: row.name,
      jobTitle: row.position,
      recipientName: row.waitingNames,
      daysOverdue: Math.max(row.dueDays, row.waitDays, 0),
      triggerReason: row.triggerCondition,
      testRecipientEmail: this.powerAutomateRecipientEmail
    };
    this.powerAutomateStatus = '已帶入面試回饋逾期資料，可送出測試提醒信。';
    this.powerAutomateDialogVisible = true;
  }

  openIntervieweePowerAutomateReminder(interviewee: any): void {
    const pendingInterviewers = this.getPendingFeedbackInterviewers(interviewee);

    if (pendingInterviewers.length === 0) {
      this.powerAutomateStatus = '這筆面試回饋已收齊，不需要產生提醒。';
      return;
    }

    const deadline = interviewee.feedbackDeadline || '';
    const dueDays = deadline ? this.daysSince(deadline) : 0;
    const waitDays = pendingInterviewers.reduce((max: number, interviewer: any) =>
      Math.max(max, this.asNumber(interviewer.waitDays), this.daysSince(deadline)),
      0
    );

    this.selectedPowerAutomateReminder = {
      candidateName: interviewee.name || '未知應聘者',
      jobTitle: interviewee.position || '未知職位',
      recipientName: pendingInterviewers.map((interviewer: any) => interviewer.name || '未命名面試官').join('、'),
      daysOverdue: Math.max(dueDays, waitDays, 0),
      triggerReason: dueDays > 0 ? '回饋期限已到' : '尚有面試官未提交回饋',
      testRecipientEmail: this.powerAutomateRecipientEmail
    };
    this.powerAutomateStatus = '已從面試回饋追蹤帶入提醒資料，可送出測試提醒信。';
    this.powerAutomateDialogVisible = true;
  }

  hasPendingFeedback(interviewee: any): boolean {
    return this.getPendingFeedbackInterviewers(interviewee).length > 0;
  }

  openPowerAutomateTriggerEmail(): void {
    if (!this.selectedPowerAutomateReminder) {
      return;
    }

    const payload: PowerAutomateReminderPayload = {
      ...this.selectedPowerAutomateReminder,
      testRecipientEmail: this.powerAutomateRecipientEmail.trim()
    };

    this.savePowerAutomateDemoSettings();
    const gmailUrl = new URL('https://mail.google.com/mail/');
    gmailUrl.searchParams.set('view', 'cm');
    gmailUrl.searchParams.set('fs', '1');
    gmailUrl.searchParams.set('to', this.powerAutomateTriggerInbox);
    gmailUrl.searchParams.set('su', this.powerAutomateTriggerSubject);
    gmailUrl.searchParams.set('body', this.buildPowerAutomateTriggerBody(payload));

    window.open(gmailUrl.toString(), '_blank', 'noopener');
    this.recordPowerAutomateReminder(payload, '待送出');
    this.powerAutomateStatus = '提醒已建立，請確認並送出；提醒紀錄已寫入本機展示資料。';
  }

  savePowerAutomateDemoSettings(): void {
    localStorage.setItem('atsPowerAutomateRecipientEmail', this.powerAutomateRecipientEmail.trim());
    this.powerAutomateStatus = '測試收件信箱已儲存。';
  }

  private loadPowerAutomateDemoSettings(): void {
    this.powerAutomateRecipientEmail = localStorage.getItem('atsPowerAutomateRecipientEmail') || this.powerAutomateRecipientEmail;
  }

  private loadPowerAutomateReminderLogs(): void {
    const rawLogs = localStorage.getItem('atsPowerAutomateReminderLogs');
    if (!rawLogs) {
      this.powerAutomateReminderLogs = [];
      return;
    }

    try {
      this.powerAutomateReminderLogs = JSON.parse(rawLogs);
    } catch {
      this.powerAutomateReminderLogs = [];
    }
  }

  get latestPowerAutomateReminderLogs(): PowerAutomateReminderLog[] {
    return [...this.powerAutomateReminderLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  private recordPowerAutomateReminder(payload: PowerAutomateReminderPayload, status: string): void {
    const log: PowerAutomateReminderLog = {
      ...payload,
      id: `${Date.now()}-${this.powerAutomateReminderLogs.length + 1}`,
      createdAt: new Date().toISOString(),
      status,
      escalationOwner: payload.daysOverdue >= 3 ? '人資主管' : '人資'
    };
    this.powerAutomateReminderLogs = [log, ...this.powerAutomateReminderLogs].slice(0, 20);
    localStorage.setItem('atsPowerAutomateReminderLogs', JSON.stringify(this.powerAutomateReminderLogs));
  }

  private buildPowerAutomateTriggerBody(payload: PowerAutomateReminderPayload): string {
    return [
      'ATS_DEMO_TRIGGER',
      '',
      `candidateName=${payload.candidateName}`,
      `jobTitle=${payload.jobTitle}`,
      `recipientName=${payload.recipientName}`,
      `daysOverdue=${payload.daysOverdue}`,
      `triggerReason=${payload.triggerReason}`,
      `testRecipientEmail=${payload.testRecipientEmail}`,
      '',
      'Demo path:',
      'ATS frontend -> Gmail trigger email -> Power Automate -> Outlook reminder email'
    ].join('\n');
  }

  private getPendingFeedbackInterviewers(interviewee: any): any[] {
    return (interviewee?.interviewers ?? []).filter((interviewer: any) => interviewer.status !== '已提交');
  }

  getRejectedApplicantActions(applicant: any): MenuItem[] {
    return [
      {
        label: '發送婉謝函',
        icon: 'pi pi-envelope',
        command: () => this.sendRejectionLetter(applicant)
      },
      {
        label: '取消追蹤',
        icon: 'pi pi-trash',
        command: () => this.unfollow(applicant)
      }
    ];
  }

  sendRejectionLetter(applicant: any) {
    alert(`已建立 ${applicant.applicantName} 的婉謝函草稿`);
  }

  sendInterviewInvitation(applicant: any) {
    if (!applicant?.id) {
      alert('找不到候選人資料，無法寄發面試邀請');
      return;
    }

    const sentAt = new Date().toISOString();
    this.trackedApplicantService.updateTrackedApplicantProcess(applicant.id, {
      processStepId: 4,
      stepStatus: '進行中',
      taskStatus: '已寄面試邀請',
      initialReviewStatus: 'Passed Initial Screening',
      status: '已寄面試邀請',
      processUpdatedAt: sentAt
    }).subscribe({
      next: () => {
        this.approvedApplicants = this.approvedApplicants.filter(item => item.id !== applicant.id);
        alert(`已寄發 ${applicant.applicantName} 的面試邀請，候選人已移至面試安排流程`);
      },
      error: () => alert('寄發面試邀請失敗，請稍後再試')
    });
  }

  unfollow(applicant: any) {
    alert(`已準備取消追蹤 ${applicant.applicantName}`);
  }

  get executiveSummaryItems(): ExecutiveSummaryItem[] {
    const highestRiskJob = [...this.jobReportRows]
      .sort((a, b) => this.riskWeight(b.riskLevel) - this.riskWeight(a.riskLevel) || b.waitDays - a.waitDays)[0];
    const topFeedbackRisk = [...this.feedbackReportRows]
      .filter(row => row.pending > 0)
      .sort((a, b) => this.riskWeight(b.riskLevel) - this.riskWeight(a.riskLevel) || b.waitDays - a.waitDays)[0];
    const zeroApplicantJob = this.jobReportRows.find(row => row.applicantCount === 0);
    const primaryBlocker = this.totalManagerNotReplied > 0
      ? '主管待辦'
      : topFeedbackRisk
        ? '面試回饋'
        : zeroApplicantJob
          ? '履歷來源'
          : '流程穩定';

    return [
      {
        label: '最高風險',
        value: highestRiskJob ? highestRiskJob.jobTitle : '尚無資料',
        description: highestRiskJob
          ? `${highestRiskJob.blocker}，等待 ${highestRiskJob.waitDays} 天。`
          : '目前沒有需要立即升級處理的職缺。',
        action: highestRiskJob ? highestRiskJob.nextAction : '維持例行追蹤',
        riskLevel: highestRiskJob ? highestRiskJob.riskLevel : '低'
      },
      {
        label: '主要卡點',
        value: primaryBlocker,
        description: primaryBlocker === '主管待辦'
          ? `${this.totalManagerNotReplied} 位候選人的初審待辦尚未完成，會影響後續面試安排。`
          : primaryBlocker === '面試回饋'
            ? `${this.pendingFeedbackCount} 份面試回饋未提交，需要催收決策資料。`
            : primaryBlocker === '履歷來源'
              ? `${this.zeroApplicantJobCount} 個職缺沒有應徵者，需要檢查曝光。`
              : '目前沒有明顯流程卡點。',
        action: primaryBlocker === '流程穩定' ? '持續監控漏斗轉換' : '依卡點啟動提醒或補量流程',
        riskLevel: primaryBlocker === '流程穩定' ? '低' : '高'
      },
      {
        label: '建議處理順序',
        value: `${this.actionableAutomationCount} 項`,
        description: '先處理主管待辦與回饋逾期，再安排履歷來源補量與例行報表匯出。',
        action: '依自動化建議建立待辦',
        riskLevel: this.actionableAutomationCount > 0 ? '中' : '低'
      }
    ];
  }

  get overallHealthStatus(): 'healthy' | 'warning' | 'critical' {
    if (this.highRiskJobCount > 0 || this.totalManagerNotReplied >= 3 || this.overdueFeedbackCount >= 2) {
      return 'critical';
    }
    if (this.totalManagerNotReplied > 0 || this.pendingFeedbackCount > 0 || this.zeroApplicantJobCount > 0) {
      return 'warning';
    }
    return 'healthy';
  }

  get healthStatusLabel(): string {
    switch (this.overallHealthStatus) {
      case 'critical': return '需立即處理';
      case 'warning': return '有待追蹤事項';
      case 'healthy': return '招募流程正常';
    }
  }

  get healthSummaryText(): string {
    const parts: string[] = [];
    const jobCount = this.openPositionList.length;
    const applicantCount = this.totalApplicantCount;

    parts.push(`目前有 ${jobCount} 個招募中職缺，共 ${applicantCount} 位應徵者。`);

    if (this.highRiskJobCount > 0) {
      parts.push(`其中 ${this.highRiskJobCount} 個職缺處於高風險狀態，需要優先關注。`);
    }

    if (this.totalManagerNotReplied > 0) {
      parts.push(`${this.totalManagerNotReplied} 位候選人的初審仍在等待主管回覆，平均等待 ${this.averageManagerWaitDays} 天。`);
    }

    if (this.pendingFeedbackCount > 0) {
      parts.push(`面試回饋完成率 ${this.feedbackCompletionRate}%，尚有 ${this.pendingFeedbackCount} 份待提交。`);
    }

    if (this.zeroApplicantJobCount > 0) {
      parts.push(`${this.zeroApplicantJobCount} 個職缺尚無應徵者，需要檢查曝光來源。`);
    }

    if (parts.length === 1) {
      parts.push('各環節運作順暢，建議維持例行追蹤。');
    }

    return parts.join('');
  }

  get actionItems(): ActionItem[] {
    const items: ActionItem[] = [];

    this.pendingApplicants
      .sort((a, b) => this.daysSince(b.sentTime) - this.daysSince(a.sentTime))
      .forEach(applicant => {
        const days = this.daysSince(applicant.sentTime);
        const supervisor = applicant.supervisor || this.findJobManager(applicant.jobTitle);
        items.push({
          iconClass: 'pi pi-user-edit',
          text: `提醒${supervisor}主管回覆${applicant.applicantName}的初審（已等 ${days} 天）`,
          urgency: days >= 3 ? 'critical' : 'warning',
          category: '主管催辦'
        });
      });

    this.feedbackReportRows
      .filter(row => row.pending > 0)
      .sort((a, b) => this.riskWeight(b.riskLevel) - this.riskWeight(a.riskLevel))
      .forEach(row => {
        items.push({
          iconClass: 'pi pi-comments',
          text: `提醒${row.waitingNames}提交${row.name}的面試回饋（${row.statusLabel === '逾期' ? '已逾期' : '待回饋'}）`,
          urgency: row.statusLabel === '逾期' ? 'critical' : 'warning',
          category: '回饋催收'
        });
      });

    this.jobReportRows
      .filter(row => row.applicantCount === 0)
      .forEach(row => {
        items.push({
          iconClass: 'pi pi-search',
          text: `「${row.jobTitle}」尚無應徵者，建議檢查職缺曝光與招募管道`,
          urgency: 'warning',
          category: '履歷來源'
        });
      });

    this.feedbackReportRows
      .filter(row => row.pending === 0 && row.submitted > 0)
      .forEach(row => {
        items.push({
          iconClass: 'pi pi-check-circle',
          text: `${row.name}（${row.position}）面試回饋已收齊，可安排主管決策`,
          urgency: 'info',
          category: '決策準備'
        });
      });

    const urgencyOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    return items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  }

  get trendMetrics(): TrendMetric[] {
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
    const currentApplicants = this.totalApplicantCount || 20;
    const currentInterviews = this.scheduledInterviewCount || 6;
    const currentOffers = this.sumJobField('hiredCount') || 2;
    const currentWait = this.averageWaitDays || 2;

    const applicantData = [12, 18, 15, 22, 19, currentApplicants];
    const interviewData = [4, 6, 5, 8, 7, currentInterviews];
    const offerData = [1, 2, 1, 3, 2, currentOffers];
    const waitData = [3, 3, 4, 2, 3, currentWait];

    const buildMetric = (label: string, data: number[], unit?: string): TrendMetric => {
      const maxVal = Math.max(...data, 1);
      const current = data[data.length - 1];
      const prev = data[data.length - 2];
      const change = prev ? Math.round(((current - prev) / prev) * 100) : 0;
      return {
        label,
        current: unit ? `${current}${unit}` : current,
        data: data.map((value, i) => ({
          week: weeks[i],
          value,
          percent: Math.max(8, Math.round((value / maxVal) * 100))
        })),
        changeText: change > 0 ? `+${change}%` : change < 0 ? `${change}%` : '持平',
        changeClass: label === '平均等待天數'
          ? (change > 0 ? 'trend-down' : change < 0 ? 'trend-up' : 'trend-flat')
          : (change > 0 ? 'trend-up' : change < 0 ? 'trend-down' : 'trend-flat')
      };
    };

    return [
      buildMetric('新進應徵', applicantData),
      buildMetric('面試場次', interviewData),
      buildMetric('錄取人數', offerData),
      buildMetric('平均等待天數', waitData, ' 天')
    ];
  }

  get hrPriorityKpis(): HrKpiItem[] {
    return [
      {
        id: 'highRiskJobs',
        label: '高風險職缺數',
        value: this.highRiskJobCount,
        detail: '等待超過門檻或流程卡住的招募案',
        source: 'jobs、trackedApplicants、interviewSessions',
        priority: '第一優先',
        tone: this.highRiskJobCount > 0 ? 'critical' : 'stable'
      },
      {
        id: 'pendingManager',
        label: '待主管回覆',
        value: this.totalManagerNotReplied,
        detail: '履歷已進入初審階段，但主管待辦尚未完成',
        source: 'jobs.managerNotReplied、trackedApplicants.taskStatus、trackedApplicants.sentTime',
        priority: '第一優先',
        tone: this.totalManagerNotReplied > 0 ? 'critical' : 'stable'
      },
      {
        id: 'feedbackCompletion',
        label: '面試回饋完成率',
        value: this.feedbackCompletionRate,
        unit: '%',
        detail: `${this.submittedFeedbackCount} / ${this.totalFeedbackCount} 份已回覆`,
        source: 'interviewSessions.feedbacks.submitted',
        priority: '第一優先',
        tone: this.feedbackCompletionRate >= 80 ? 'stable' : 'warning'
      },
      {
        id: 'averageWait',
        label: '平均等待天數',
        value: this.averageWaitDays,
        detail: '主管待辦與面試回饋等待時間合併估算',
        source: 'trackedApplicants.sentTime、interviewSessions.feedbackDeadline',
        priority: '第一優先',
        tone: this.averageWaitDays >= 2 ? 'warning' : 'stable'
      },
      {
        id: 'funnelConversion',
        label: '招募漏斗轉換率',
        value: this.primaryFunnelConversionRate,
        unit: '%',
        detail: '應徵進入一面比例，用來觀察履歷品質與主管篩選效率',
        source: 'jobs.applicantCount、jobs.firstInterview',
        priority: '第一優先',
        tone: this.primaryFunnelConversionRate >= 50 ? 'stable' : 'warning'
      }
    ];
  }

  get hrKpiGroups(): HrKpiGroup[] {
    return [
      {
        title: '招募健康',
        description: '判斷目前招募量是否足以支撐職缺需求。',
        items: [
          this.makeKpi('openJobs', '開放職缺', this.openPositionList.length, '目前招募中的職缺數', 'jobs.status', '第二層', 'neutral'),
          this.makeKpi('totalApplicants', '總應徵人數', this.totalApplicantCount, '所有招募中職缺的履歷量', 'jobs.applicantCount', '第二層', 'neutral'),
          this.makeKpi('zeroApplicantJobs', '無應徵者職缺', this.zeroApplicantJobCount, '需要補曝光或調整職缺描述', 'jobs.applicantCount', '第二層', this.zeroApplicantJobCount > 0 ? 'warning' : 'stable'),
          this.hrPriorityKpis[0]
        ]
      },
      {
        title: '漏斗轉換',
        description: '追蹤候選人從應徵到面試與任用的轉換。',
        items: [
          this.hrPriorityKpis[4],
          this.makeKpi('managerResponseRate', '初審完成率', this.managerResponseRate, '初審已完成人數占總應徵人數', 'jobs.managerReplied / jobs.applicantCount', '第二層', this.managerResponseRate >= 70 ? 'stable' : 'warning', '%'),
          this.makeKpi('firstInterviewCount', '一面人數', this.sumJobField('firstInterview'), '已進入第一輪面試的人數', 'jobs.firstInterview', '第二層', 'neutral'),
          this.makeKpi('jointInterviewCount', '聯合面試人數', this.sumJobField('jointInterview'), '已進入聯合面試的人數', 'jobs.jointInterview', '第二層', 'neutral'),
          this.makeKpi('selectionMeetingCount', '人選會人數', this.sumJobField('selectionMeeting'), '已進入人選會的人數', 'jobs.selectionMeeting', '第二層', 'neutral'),
          this.makeKpi('hiredCount', '錄取人數', this.sumJobField('hiredCount'), '已完成錄取確認的人數', 'jobs.hiredCount', '第二層', 'neutral'),
          this.makeKpi('onboardingCount', '到職人數', this.sumJobField('onBoarding'), '已完成到職的人數', 'jobs.onBoarding', '第二層', 'neutral')
        ]
      },
      {
        title: '流程效率',
        description: '觀察流程等待時間與可能延誤的位置。',
        items: [
          this.hrPriorityKpis[3],
          this.makeKpi('averageManagerWait', '主管待辦平均等待', this.averageManagerWaitDays, '初審階段待主管回覆候選人的平均等待天數', 'trackedApplicants.taskStatus / sentTime', '第二層', this.averageManagerWaitDays >= 2 ? 'warning' : 'stable'),
          this.makeKpi('averageFeedbackWait', '回饋平均等待', this.averageFeedbackWaitDays, '未提交面試回饋的平均等待天數', 'interviewSessions.feedbackDeadline', '第二層', this.averageFeedbackWaitDays >= 1 ? 'warning' : 'stable')
        ]
      },
      {
        title: '待辦風險',
        description: '整理需要人資催辦或升級處理的事項。',
        items: [
          this.hrPriorityKpis[1],
          this.makeKpi('pendingFeedback', '未回饋份數', this.pendingFeedbackCount, '面試官尚未提交的回饋份數', 'interviewSessions.feedbacks.submitted', '第二層', this.pendingFeedbackCount > 0 ? 'warning' : 'stable'),
          this.makeKpi('overdueFeedback', '回饋逾期場次', this.overdueFeedbackCount, '已超過回饋期限且仍未收齊的面試場次', 'interviewSessions.feedbackDeadline', '第二層', this.overdueFeedbackCount > 0 ? 'critical' : 'stable'),
          this.makeKpi('automationActions', '自動化建議數', this.actionableAutomationCount, '可由流程或腳本處理的重複待辦', 'automationOpportunities', '第三層', this.actionableAutomationCount > 0 ? 'warning' : 'stable')
        ]
      }
    ];
  }

  get selectedKpiItem(): HrKpiItem | null {
    if (!this.selectedKpiId) {
      return null;
    }
    return [
      ...this.hrPriorityKpis,
      ...this.hrKpiGroups.flatMap(group => group.items)
    ].find(item => item.id === this.selectedKpiId) ?? null;
  }

  get selectedKpiDrilldownRows(): KpiDrilldownRow[] {
    return this.selectedKpiId ? this.getKpiDrilldownRows(this.selectedKpiId) : [];
  }

  get workbenchJobRows(): JobReportRow[] {
    return [...this.jobReportRows].sort((a, b) =>
      this.riskWeight(b.riskLevel) - this.riskWeight(a.riskLevel)
      || b.waitDays - a.waitDays
      || this.jobTaskWeight(b) - this.jobTaskWeight(a)
      || b.applicantCount - a.applicantCount
    );
  }

  get selectedWorkbenchJob(): JobReportRow | null {
    if (!this.selectedReportJobTitle) {
      return null;
    }
    return this.workbenchJobRows.find(row => row.jobTitle === this.selectedReportJobTitle) ?? null;
  }

  get taskQueueItems(): TaskQueueItem[] {
    const managerTasks = this.pendingApplicants.map(applicant => ({
      title: '初審待主管回覆',
      category: '主管提醒',
      target: `${applicant.applicantName || '未命名候選人'}｜${applicant.jobTitle || '未命名職缺'}`,
      owner: applicant.supervisor || this.findJobManager(applicant.jobTitle),
      priority: this.daysSince(applicant.sentTime) >= 2 ? '高' as RiskLevel : '中' as RiskLevel,
      waitDays: this.daysSince(applicant.sentTime),
      tool: 'Power Automate',
      sourceField: 'trackedApplicants.sentTime',
      action: '提醒主管完成初審'
    }));

    const feedbackTasks = this.feedbackReportRows
      .filter(row => row.pending > 0)
      .map(row => ({
        title: row.statusLabel === '逾期' ? '面試回饋逾期' : '面試回饋待收',
        category: '回饋催收',
        target: `${row.name}｜${row.position}`,
        owner: row.waitingNames,
        priority: row.riskLevel,
        waitDays: row.waitDays,
        tool: 'Power Automate',
        sourceField: 'interviewSessions.feedbacks.submitted',
        action: row.nextAction
      }));

    const sourcingTasks = this.jobReportRows
      .filter(row => row.applicantCount === 0)
      .map(row => ({
        title: '無應徵者職缺',
        category: '履歷來源',
        target: row.jobTitle,
        owner: row.manager,
        priority: row.waitDays >= 5 ? '中' as RiskLevel : '低' as RiskLevel,
        waitDays: row.waitDays,
        tool: 'Python',
        sourceField: 'jobs.applicantCount',
        action: '檢查職缺曝光與履歷來源'
      }));

    const reportTask: TaskQueueItem = {
      title: '每週報表匯出',
      category: '資料整理',
      target: `${this.openPositionList.length} 個招募中職缺`,
      owner: '人資',
      priority: '中',
      waitDays: '固定',
      tool: 'Python',
      sourceField: 'jobs / trackedApplicants / interviewSessions',
      action: '匯出 Power BI 可用資料'
    };

    const rejectionTasks = this.rejectedApplicants.length > 0
      ? [{
        title: '婉謝信草稿',
        category: '候選人溝通',
        target: `${this.rejectedApplicants.length} 位已拒絕人選`,
        owner: '人資',
        priority: '中' as RiskLevel,
        waitDays: '待處理',
        tool: 'AI 工具',
        sourceField: 'trackedApplicants.stepStatus',
        action: '建立正式婉謝信草稿'
      }]
      : [];

    return [...managerTasks, ...feedbackTasks, ...sourcingTasks, reportTask, ...rejectionTasks]
      .sort((a, b) =>
        this.riskWeight(b.priority) - this.riskWeight(a.priority)
        || this.asNumber(b.waitDays) - this.asNumber(a.waitDays)
      );
  }

  get allTrackedApplicants(): any[] {
    return Object.values(this.trackedApplicantsByJobTitle).flat();
  }

  get zeroApplicantJobCount(): number {
    return this.jobReportRows.filter(row => row.applicantCount === 0).length;
  }

  get primaryFunnelConversionRate(): number {
    return this.percent(this.sumJobField('firstInterview'), this.totalApplicantCount);
  }

  get managerResponseRate(): number {
    return this.percent(this.sumJobField('managerReplied'), this.totalApplicantCount);
  }

  get averageManagerWaitDays(): number {
    return this.average(
      this.pendingApplicants
        .map(applicant => this.daysSince(applicant.sentTime))
        .filter(day => day > 0)
    );
  }

  get averageFeedbackWaitDays(): number {
    return this.average(
      this.feedbackReportRows
        .filter(row => row.pending > 0)
        .map(row => row.waitDays)
        .filter(day => day > 0)
    );
  }

  get overdueFeedbackCount(): number {
    return this.feedbackReportRows.filter(row => row.pending > 0 && row.dueDays > 0).length;
  }

  get actionableAutomationCount(): number {
    return this.automationOpportunities.filter(item => item.priority !== '低').length;
  }

  toggleKpi(kpiId: string): void {
    this.selectedKpiId = this.selectedKpiId === kpiId ? null : kpiId;
    if (this.selectedKpiId) {
      this.selectedReportJobTitle = null;
    }
  }

  isKpiSelected(kpiId: string): boolean {
    return this.selectedKpiId === kpiId;
  }

  getKpiDrilldownRows(kpiId: string): KpiDrilldownRow[] {
    switch (kpiId) {
      case 'pendingManager':
      case 'averageManagerWait':
        return this.pendingApplicants.map(applicant => ({
          primary: applicant.applicantName || '未命名候選人',
          secondary: applicant.jobTitle || '未命名職缺',
          owner: applicant.supervisor || this.findJobManager(applicant.jobTitle),
          status: `${applicant.taskStatus || '待主管回覆'} / 送出 ${this.formatDateTime(applicant.sentTime)}`,
          waitDays: this.daysSince(applicant.sentTime),
          sourceField: 'trackedApplicants.taskStatus / sentTime / managerResponseDueAt',
          action: '提醒主管完成初審'
        }));
      case 'feedbackCompletion':
      case 'pendingFeedback':
      case 'averageFeedbackWait':
      case 'overdueFeedback':
        return this.feedbackReportRows
          .filter(row => kpiId === 'feedbackCompletion' || row.pending > 0)
          .map(row => ({
            primary: row.name,
            secondary: row.position,
            owner: row.waitingNames,
            status: row.statusLabel,
            waitDays: row.pending > 0 ? row.waitDays : '已完成',
            sourceField: 'interviewSessions.feedbacks.submitted / feedbackDeadline',
            action: row.nextAction
          }));
      case 'highRiskJobs':
      case 'averageWait':
        return this.jobReportRows
          .filter(row => kpiId === 'averageWait' ? row.waitDays > 0 : row.riskLevel === '高')
          .map(row => this.jobRowToDrilldown(row));
      case 'zeroApplicantJobs':
        return this.jobReportRows
          .filter(row => row.applicantCount === 0)
          .map(row => this.jobRowToDrilldown(row));
      case 'automationActions':
        return this.automationOpportunities
          .filter(item => item.priority !== '低')
          .map(item => ({
            primary: item.title,
            secondary: item.tool,
            owner: item.owner,
            status: item.trigger,
            waitDays: item.priority,
            sourceField: item.sourceField,
            action: item.impact
          }));
      default:
        return this.jobReportRows.map(row => this.jobRowToDrilldown(row));
    }
  }

  getJobSourceRows(row: JobReportRow): KpiDrilldownRow[] {
    if (row.applicantCount === 0) {
      return [this.jobRowToDrilldown(row)];
    }
    if (row.currentStage === '初審') {
      return this.getKpiDrilldownRows('pendingManager').filter(item => item.secondary === row.jobTitle);
    }
    if (row.currentStage === '面試回饋') {
      return this.getKpiDrilldownRows('pendingFeedback').filter(item => item.secondary === row.jobTitle);
    }
    return (this.trackedApplicantsByJobTitle[row.jobTitle] ?? []).map(applicant => ({
      primary: applicant.applicantName || '未命名候選人',
      secondary: row.jobTitle,
      owner: applicant.supervisor || row.manager,
      status: `${this.reviewStatusLabel(applicant.initialReviewStatus)} / ${applicant.stepLabel || '尚無流程'}`,
      waitDays: this.daysSince(applicant.processUpdatedAt || applicant.sentTime),
      sourceField: 'trackedApplicants.processStepId / taskStatus / processUpdatedAt',
      action: row.nextAction
    }));
  }

  get recruitmentKpis(): RecruitmentKpi[] {
    return [
      {
        label: '開放職缺',
        value: this.openPositionList.length,
        detail: `高風險 ${this.highRiskJobCount} 個`,
        tone: 'blue'
      },
      {
        label: '總應徵人數',
        value: this.totalApplicantCount,
        detail: '由職缺招募數據彙整',
        tone: 'slate'
      },
      {
        label: '待主管回覆',
        value: this.totalManagerNotReplied,
        detail: this.totalManagerNotReplied > 0 ? '已達提醒條件' : '目前無待辦',
        tone: 'amber'
      },
      {
        label: '面試回饋完成率',
        value: `${this.feedbackCompletionRate}%`,
        detail: `${this.submittedFeedbackCount} / ${this.totalFeedbackCount} 份已回覆`,
        tone: 'green'
      },
      {
        label: '平均等待天數',
        value: this.averageWaitDays,
        detail: '主管回覆與面試回饋合併估算',
        tone: 'amber'
      }
    ];
  }

  get recruitmentFunnel(): FunnelStage[] {
    const applicantTotal = Math.max(this.totalApplicantCount, 1);
    const stages = [
      { label: '應徵人數', count: this.totalApplicantCount },
      { label: '初審完成', count: this.sumJobField('managerReplied') },
      { label: '一面', count: this.sumJobField('firstInterview') },
      { label: '聯合面試', count: this.sumJobField('jointInterview') },
      { label: '人選會', count: this.sumJobField('selectionMeeting') },
      { label: '錄取', count: this.sumJobField('hiredCount') },
      { label: '人選任用', count: this.sumJobField('candidateAppointment') },
      { label: '到職', count: this.sumJobField('onBoarding') }
    ];

    return stages.map((stage, index) => {
      const previousCount = index === 0 ? stage.count : stages[index - 1].count;
      const conversionRate = previousCount > 0 ? Math.round((stage.count / previousCount) * 100) : 0;
      const dropOffCount = Math.max(previousCount - stage.count, 0);
      return {
        ...stage,
        previousCount,
        conversionRate,
        dropOffCount,
        percent: Math.min(100, Math.round((stage.count / applicantTotal) * 100)),
        insight: index === 0 ? '招募入口量' : `較前一階段少 ${dropOffCount} 位`
      };
    });
  }

  get reportRiskItems(): RiskItem[] {
    const jobRisks = this.jobReportRows
      .filter(row => row.riskLevel !== '低')
      .map(row => ({
        title: `${row.jobTitle}｜${row.healthLabel}`,
        description: `${row.blocker}，已等待 ${row.waitDays} 天。${row.blockerReason}`,
        action: row.nextAction,
        riskLevel: row.riskLevel
      }));

    const feedbackRisks = this.feedbackReportRows
      .filter(row => row.pending > 0)
      .map(row => ({
        title: `${row.name}｜面試回饋${row.statusLabel}`,
        description: `尚有 ${row.pending} 份未回覆，待提醒：${row.waitingNames}。`,
        action: row.nextAction,
        riskLevel: row.riskLevel
      }));

    return [...jobRisks, ...feedbackRisks]
      .sort((a, b) => this.riskWeight(b.riskLevel) - this.riskWeight(a.riskLevel))
      .slice(0, 4);
  }

  get jobReportRows(): JobReportRow[] {
    return this.openPositionList.map(job => this.buildJobReportRow(job));
  }

  get feedbackReportRows(): FeedbackReportRow[] {
    return this.interviewees.map(interviewee => {
      const interviewers = interviewee.interviewers ?? [];
      const submitted = interviewers.filter((interviewer: any) => interviewer.status === '已提交').length;
      const pendingInterviewers = interviewers.filter((interviewer: any) => interviewer.status !== '已提交');
      const pending = pendingInterviewers.length;
      const waitDays = pendingInterviewers.reduce((max: number, interviewer: any) =>
        Math.max(max, this.asNumber(interviewer.waitDays), this.daysSince(interviewee.feedbackDeadline)),
        0
      );
      const deadline = interviewee.feedbackDeadline || '';
      const dueDays = deadline ? this.daysSince(deadline) : 0;
      const isOverdue = pending > 0 && dueDays > 0;
      const waitingNames = pendingInterviewers.map((interviewer: any) => interviewer.name || '未命名面試官').join('、');
      const riskLevel: RiskLevel = pending === 0 ? '低' : isOverdue || waitDays >= 2 ? '高' : '中';

      return {
        name: interviewee.name || '未知應聘者',
        position: interviewee.position || '未知職位',
        interviewDate: interviewee.interviewDate,
        deadline,
        submitted,
        pending,
        waitDays,
        dueDays,
        waitingNames: waitingNames || '無',
        statusLabel: pending === 0 ? '已完成' : isOverdue ? '逾期' : '待回饋',
        riskLevel,
        nextAction: pending === 0 ? '納入決策資料' : '發送回饋提醒',
        triggerCondition: pending === 0 ? '回饋已收齊' : '回饋期限已到或等待超過 1 天'
      };
    });
  }

  get automationOpportunities(): AutomationOpportunity[] {
    return [
      {
        title: '主管待辦提醒',
        tool: 'Power Automate',
        signal: `${this.totalManagerNotReplied} 位待主管回覆`,
        trigger: '履歷送出後超過 2 天仍未回覆',
        owner: '用人主管',
        impact: '減少履歷停留時間',
        priority: this.totalManagerNotReplied > 0 ? '高' : '低',
        inputData: '候選人、職缺、主管、送出時間、回覆期限',
        outputResult: '建立主管提醒待辦，並回寫提醒時間',
        sourceField: 'trackedApplicants.sentTime / managerResponseDueAt'
      },
      {
        title: '面試回饋催收',
        tool: 'Power Automate',
        signal: `${this.pendingFeedbackCount} 份回饋未提交`,
        trigger: '面試回饋期限到期或等待超過 1 天',
        owner: '面試官',
        impact: '提升決策資料完整度',
        priority: this.pendingFeedbackCount > 0 ? '高' : '低',
        inputData: '面試場次、面試官、回饋期限、未提交狀態',
        outputResult: '寄送回饋提醒，彙整逾期清單給人資',
        sourceField: 'interviewSessions.feedbacks.submitted / feedbackDeadline'
      },
      {
        title: '每週報表匯出',
        tool: 'Python',
        signal: `${this.openPositionList.length} 個職缺需彙整`,
        trigger: '每週固定產生招募進度摘要',
        owner: '人資',
        impact: '降低人工整理時間',
        priority: '中',
        inputData: 'jobs、trackedApplicants、interviewSessions',
        outputResult: '輸出給 Power BI 或週會使用的 CSV 報表資料',
        sourceField: 'db.json 三個主要資料表'
      },
      {
        title: '婉謝信草稿',
        tool: 'AI 工具',
        signal: `${this.rejectedApplicants.length} 位已拒絕人選`,
        trigger: '主管或面試流程標記不適合',
        owner: '人資',
        impact: '讓候選人溝通更一致',
        priority: this.rejectedApplicants.length > 0 ? '中' : '低',
        inputData: '候選人姓名、職缺、拒絕階段、備註',
        outputResult: '產生正式且一致的婉謝信草稿',
        sourceField: 'trackedApplicants.stepStatus / note'
      }
    ];
  }

  get totalApplicantCount(): number {
    return this.sumJobField('applicantCount');
  }

  get totalManagerNotReplied(): number {
    return this.sumJobField('managerNotReplied');
  }

  get totalFeedbackCount(): number {
    return this.interviewees.reduce((count, interviewee) =>
      count + (interviewee.interviewers ?? []).length,
      0
    );
  }

  get submittedFeedbackCount(): number {
    return this.interviewees.reduce((count, interviewee) =>
      count + (interviewee.interviewers ?? []).filter((interviewer: any) => interviewer.status === '已提交').length,
      0
    );
  }

  get feedbackCompletionRate(): number {
    if (this.totalFeedbackCount === 0) {
      return 0;
    }
    return Math.round((this.submittedFeedbackCount / this.totalFeedbackCount) * 100);
  }

  get highRiskJobCount(): number {
    return this.jobReportRows.filter(row => row.riskLevel === '高').length;
  }

  get averageWaitDays(): number {
    const waits = [
      ...this.jobReportRows.map(row => row.waitDays),
      ...this.feedbackReportRows.filter(row => row.pending > 0).map(row => row.waitDays)
    ].filter(day => day > 0);

    if (!waits.length) {
      return 0;
    }
    return Math.round(waits.reduce((sum, day) => sum + day, 0) / waits.length);
  }

  get interviewApplicantCount(): number {
    return new Set(this.interviewees.map(interviewee => `${interviewee.name}-${interviewee.position}`)).size;
  }

  toggleReportJob(jobTitle: string): void {
    this.selectedReportJobTitle = this.selectedReportJobTitle === jobTitle ? null : jobTitle;
    if (this.selectedReportJobTitle) {
      this.selectedKpiId = null;
    }
  }

  isReportJobExpanded(jobTitle: string): boolean {
    return this.selectedReportJobTitle === jobTitle;
  }

  toggleAutomation(title: string): void {
    this.selectedAutomationTitle = this.selectedAutomationTitle === title ? null : title;
  }

  isAutomationExpanded(title: string): boolean {
    return this.selectedAutomationTitle === title;
  }

  exportRecruitmentReport(): void {
    const kpiHeader = ['類型', '群組', '指標', '數值', '說明', '來源欄位'];
    const kpiRows = this.hrKpiGroups.flatMap(group =>
      group.items.map(item => [
        '人資KPI',
        group.title,
        item.label,
        `${item.value}${item.unit ?? ''}`,
        item.detail,
        item.source
      ])
    );
    const jobHeader = ['職缺', '主管', '應徵人數', '目前階段', '卡點', '風險等級', '等待天數', '來源資料', '來源欄位', '建議動作', '自動化觸發條件'];
    const jobRows = this.jobReportRows.map(row => {
      const sourceRows = this.getJobSourceRows(row);
      return [
        '職缺狀態',
        row.jobTitle,
        row.manager,
        row.applicantCount,
        row.currentStage,
        row.blocker,
        row.riskLevel,
        row.waitDays,
        sourceRows.map(source => source.primary).join('、') || '尚無資料',
        sourceRows.map(source => source.sourceField).filter((field, index, fields) => fields.indexOf(field) === index).join('、') || '尚無資料',
        row.nextAction,
        row.automationTrigger
      ];
    });
    const automationHeader = ['類型', '項目', '工具', '觸發條件', '負責對象', '資料來源', '輸入資料', '輸出結果', '預期效益'];
    const automationRows = this.automationOpportunities.map(item => [
      '自動化建議',
      item.title,
      item.tool,
      item.trigger,
      item.owner,
      item.sourceField,
      item.inputData,
      item.outputResult,
      item.impact
    ]);
    const taskHeader = ['類型', '分類', '待辦', '對象', '負責人', '風險', '等待', '工具', '來源欄位', '建議動作'];
    const taskRows = this.taskQueueItems.map(item => [
      '待辦佇列',
      item.category,
      item.title,
      item.target,
      item.owner,
      item.priority,
      item.waitDays,
      item.tool,
      item.sourceField,
      item.action
    ]);
    const csvRows: CsvCell[][] = [];
    if (this.exportCsvSections.kpi) {
      csvRows.push(['人資KPI'], kpiHeader, ...kpiRows, []);
    }
    if (this.exportCsvSections.jobStatus) {
      csvRows.push(['職缺狀態'], ['類型', ...jobHeader], ...jobRows, []);
    }
    if (this.exportCsvSections.taskQueue) {
      csvRows.push(['待辦佇列'], taskHeader, ...taskRows, []);
    }
    if (this.exportCsvSections.automation) {
      csvRows.push(['自動化建議'], automationHeader, ...automationRows);
    }
    const csv = csvRows
      .map(row => row.map(value => this.escapeCsv(value)).join(','))
      .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '招募分析報表.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  exportPowerBiDataset(): void {
    const allExports = [
      { key: 'dimJobs', filename: 'powerbi_dim_jobs.csv', rows: this.buildPowerBiJobRows() },
      { key: 'factCandidates', filename: 'powerbi_fact_candidate_pipeline.csv', rows: this.buildPowerBiCandidateRows() },
      { key: 'factFeedback', filename: 'powerbi_fact_interview_feedback.csv', rows: this.buildPowerBiFeedbackRows() },
      { key: 'factAutomation', filename: 'powerbi_fact_automation_tasks.csv', rows: this.buildPowerBiAutomationRows() }
    ];

    const selected = allExports.filter(item => (this.exportPbiSections as Record<string, boolean>)[item.key]);
    selected.forEach((item, index) => {
      window.setTimeout(() => this.downloadCsv(item.filename, item.rows), index * 120);
    });
  }

  private buildPowerBiJobRows(): CsvCell[][] {
    return [
      ['job_id', 'job_title', 'department', 'manager', 'job_status', 'created_date', 'applicant_count', 'current_stage', 'risk_level', 'wait_days', 'blocker', 'next_action'],
      ...this.workbenchJobRows.map(row => {
        const job = this.openPositionList.find(item => item.jobTitle === row.jobTitle);
        return [
          job?.id ?? row.jobTitle,
          row.jobTitle,
          job?.department ?? '未指定',
          row.manager,
          job?.jobStatus ?? '招募中',
          this.toIsoDate((job as any)?.createdDate),
          row.applicantCount,
          row.currentStage,
          row.riskLevel,
          row.waitDays,
          row.blocker,
          row.nextAction
        ];
      })
    ];
  }

  private buildPowerBiCandidateRows(): CsvCell[][] {
    return [
      ['candidate_id', 'candidate_name', 'job_title', 'current_stage', 'stage_status', 'task_status', 'owner', 'sent_time', 'process_updated_at', 'wait_days', 'initial_review_status', 'source_field'],
      ...this.allTrackedApplicants.map(applicant => [
        applicant.id ?? `${applicant.jobTitle}-${applicant.applicantName}`,
        applicant.applicantName,
        applicant.jobTitle,
        applicant.stepLabel,
        applicant.stepStatus,
        applicant.taskStatus,
        applicant.supervisor || this.findJobManager(applicant.jobTitle),
        this.toIsoDate(applicant.sentTime),
        this.toIsoDate(applicant.processUpdatedAt || applicant.sentTime),
        this.daysSince(applicant.processUpdatedAt || applicant.sentTime),
        applicant.initialReviewStatus,
        'trackedApplicants'
      ])
    ];
  }

  private buildPowerBiFeedbackRows(): CsvCell[][] {
    const rows = this.interviewees.flatMap(interviewee =>
      (interviewee.interviewers ?? []).map((interviewer: any) => [
        interviewee.sessionId,
        interviewee.name,
        interviewee.position,
        this.toIsoDate(interviewee.interviewDate),
        this.toIsoDate(interviewee.feedbackDeadline),
        interviewer.name,
        interviewer.status,
        interviewer.submitted,
        interviewer.waitDays,
        interviewer.comment || '',
        'interviewSessions.feedbacks'
      ])
    );

    return [
      ['session_id', 'candidate_name', 'job_title', 'interview_time', 'feedback_deadline', 'interviewer_name', 'feedback_status', 'submitted', 'wait_days', 'comment', 'source_field'],
      ...rows
    ];
  }

  private buildPowerBiAutomationRows(): CsvCell[][] {
    const opportunityRows = this.automationOpportunities.map(item => [
      item.title,
      item.tool,
      item.trigger,
      item.owner,
      item.priority,
      item.signal,
      item.inputData,
      item.outputResult,
      item.impact,
      item.sourceField,
      '',
      ''
    ]);
    const reminderRows = this.powerAutomateReminderLogs.map(log => [
      '面試回饋催收紀錄',
      'Power Automate',
      log.triggerReason,
      log.recipientName,
      log.daysOverdue >= 3 ? '高' : '中',
      `${log.candidateName}｜${log.jobTitle}`,
      'PowerAutomateReminderPayload',
      log.status,
      `升級對象：${log.escalationOwner}`,
      'localStorage.atsPowerAutomateReminderLogs',
      log.createdAt,
      log.testRecipientEmail
    ]);

    return [
      ['task_name', 'tool', 'trigger_condition', 'owner', 'priority', 'signal', 'input_data', 'output_result', 'expected_impact', 'source_field', 'created_at', 'test_recipient_email'],
      ...opportunityRows,
      ...reminderRows
    ];
  }

  private makeKpi(
    id: string,
    label: string,
    value: string | number,
    detail: string,
    source: string,
    priority: HrKpiItem['priority'],
    tone: HrKpiItem['tone'],
    unit?: string
  ): HrKpiItem {
    return { id, label, value, detail, source, priority, tone, unit };
  }

  private jobRowToDrilldown(row: JobReportRow): KpiDrilldownRow {
    return {
      primary: row.jobTitle,
      secondary: row.currentStage,
      owner: row.manager,
      status: row.blocker,
      waitDays: row.waitDays,
      sourceField: row.automationTrigger,
      action: row.nextAction
    };
  }

  private jobTaskWeight(row: JobReportRow): number {
    return this.asNumber(row.blocker.match(/\d+/)?.[0]) + (row.applicantCount === 0 ? 1 : 0);
  }

  private average(values: number[]): number {
    if (!values.length) {
      return 0;
    }
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private percent(numerator: number, denominator: number): number {
    if (denominator <= 0) {
      return 0;
    }
    return Math.round((numerator / denominator) * 100);
  }

  private findJobManager(jobTitle: string): string {
    const job = this.openPositionList.find(item => item.jobTitle === jobTitle);
    return job?.manager || '尚未指定';
  }

  getSupervisorId(jobTitle: string): string | null {
    const job = this.openPositionList.find(item => item.jobTitle === jobTitle);
    return (job as any)?.supervisorId ?? null;
  }

  reviewStatusLabel(status: string): string {
    if (status === 'Passed Initial Screening') {
      return '初審通過';
    }
    if (status === 'Rejected') {
      return '未通過';
    }
    return '初審待確認';
  }

  getTaskStatusClass(status: TaskStatus | string | undefined): string {
    if (status === '已逾期') {
      return 'task-status-overdue';
    }

    if (status === '已提醒') {
      return 'task-status-reminded';
    }

    if (status === '已完成') {
      return 'task-status-completed';
    }

    if (status === '待寄面試邀請') {
      return 'task-status-reminded';
    }

    if (status === '已寄面試邀請') {
      return 'task-status-completed';
    }

    return 'task-status-waiting';
  }

  getReviewStatusClass(status: string | undefined): string {
    if (status === 'Passed Initial Screening') {
      return 'review-status-passed';
    }

    if (status === 'Rejected') {
      return 'review-status-rejected';
    }

    return 'review-status-pending';
  }

  private resolveTaskStatus(applicant: TrackedApplicant, reviewStatus: string): TaskStatus {
    const rawStatus = (applicant as any).taskStatus as TaskStatus | undefined;
    if (rawStatus) {
      return rawStatus;
    }
    if (reviewStatus !== 'Pending Review' || (applicant as any).managerRespondedAt || applicant.supervisorConfirmed) {
      return '已完成';
    }
    if ((applicant as any).managerReminderSentAt || (applicant as any).remindedAt) {
      return '已提醒';
    }
    const dueAt = (applicant as any).managerResponseDueAt;
    if (dueAt && new Date(dueAt).getTime() < this.reportGeneratedAt.getTime()) {
      return '已逾期';
    }
    return '待主管回覆';
  }

  private formatDateTime(value: string | undefined): string {
    if (!value) {
      return '尚無資料';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '尚無資料';
    }
    return date.toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  private buildJobReportRow(job: Job): JobReportRow {
    const applicantCount = this.asNumber(job.applicantCount);
    const pendingManager = this.asNumber(job.managerNotReplied);
    const pendingFeedback = this.countPendingFeedbackByJob(job.jobTitle);
    const pendingApplicants = (this.trackedApplicantsByJobTitle[job.jobTitle] ?? [])
      .filter(applicant => applicant.initialReviewStatus === 'Pending Review');
    const pendingManagerWait = pendingApplicants.reduce((max, applicant) =>
      Math.max(max, this.daysSince(applicant.sentTime)),
      0
    );
    const pendingFeedbackWait = this.maxPendingFeedbackWaitByJob(job.jobTitle);
    const selectionGap = Math.max(0, this.asNumber(job.jointInterview) - this.asNumber(job.selectionMeeting));
    const offerGap = Math.max(0, this.asNumber(job.selectionMeeting) - this.asNumber(job.hiredCount));
    const onboardingGap = Math.max(0, this.asNumber(job.candidateAppointment) - this.asNumber(job.onBoarding));

    let blocker = '流程正常推進';
    let blockerReason = '目前沒有明顯延誤，維持例行追蹤即可。';
    let nextAction = '維持每週追蹤';
    let healthLabel = '穩定';
    let riskLevel: RiskLevel = '低';
    let waitDays = 0;
    let currentStage = '招募追蹤';
    let automationTrigger = '每週固定彙整招募狀態';

    if (applicantCount === 0) {
      waitDays = this.daysSince((job as any).createdDate);
      blocker = '目前沒有應徵者';
      blockerReason = '職缺已開放但尚未收到履歷，需要檢查曝光來源與職缺描述。';
      nextAction = '檢查職缺曝光與履歷來源';
      healthLabel = '需補量';
      riskLevel = waitDays >= 5 ? '中' : '低';
      currentStage = '履歷來源';
      automationTrigger = '職缺開放超過 5 天且應徵人數為 0';
    } else if (pendingManager > 0) {
      waitDays = pendingManagerWait;
      blocker = `${pendingManager} 位待主管回覆`;
      blockerReason = '候選人仍在初審階段，但主管待辦尚未完成，會拖慢後續面試安排。';
      nextAction = '啟動主管提醒流程';
      healthLabel = '需催辦';
      riskLevel = waitDays >= 2 ? '高' : '中';
      currentStage = '初審';
      automationTrigger = '履歷送出後超過 2 天仍未回覆';
    } else if (pendingFeedback > 0) {
      waitDays = pendingFeedbackWait;
      blocker = `${pendingFeedback} 份面試回饋未收齊`;
      blockerReason = '面試已完成但評語未完整回收，會影響人選會或錄取決策。';
      nextAction = '啟動面試官催收流程';
      healthLabel = '需催辦';
      riskLevel = waitDays >= 2 ? '高' : '中';
      currentStage = '面試回饋';
      automationTrigger = '面試回饋期限到期或等待超過 1 天';
    } else if (selectionGap > 0) {
      waitDays = this.maxProcessWaitByJob(job.jobTitle);
      blocker = `${selectionGap} 位待進入人選會`;
      blockerReason = '已有聯合面試結果，但尚未整理成決策會議資料。';
      nextAction = '整理面試結論與決策資料';
      healthLabel = '待決策';
      riskLevel = '中';
      currentStage = '人選會';
      automationTrigger = '聯合面試後仍未進入人選會';
    } else if (offerGap > 0) {
      waitDays = this.maxProcessWaitByJob(job.jobTitle);
      blocker = `${offerGap} 位待錄取確認`;
      blockerReason = '人選會已完成，但錄取與任用流程尚未完成。';
      nextAction = '追蹤薪資與任用流程';
      healthLabel = '待決策';
      riskLevel = '中';
      currentStage = '錄取確認';
      automationTrigger = '人選會通過後尚未完成錄取確認';
    } else if (onboardingGap > 0) {
      waitDays = this.maxProcessWaitByJob(job.jobTitle);
      blocker = `${onboardingGap} 位待到職`;
      blockerReason = '任用流程已啟動，需要追蹤報到文件與到職安排。';
      nextAction = '同步報到文件與到職提醒';
      healthLabel = '待到職';
      riskLevel = '中';
      currentStage = '到職準備';
      automationTrigger = '任用完成後尚未到職';
    }

    return {
      jobTitle: job.jobTitle || '未命名職缺',
      manager: job.manager || '尚未指定',
      applicantCount,
      blocker,
      blockerReason,
      nextAction,
      healthLabel,
      riskLevel,
      waitDays,
      currentStage,
      progressPercent: this.calculateJobProgress(job),
      conversionRate: this.calculateJobConversion(job),
      automationTrigger
    };
  }

  private sumJobField(field: keyof Pick<Job, 'applicantCount' | 'managerNotReplied' | 'managerReplied' | 'firstInterview' | 'jointInterview' | 'selectionMeeting' | 'hiredCount' | 'candidateAppointment' | 'onBoarding'>): number {
    return this.openPositionList.reduce((sum, job) => sum + this.asNumber(job[field]), 0);
  }

  private countPendingFeedbackByJob(jobTitle: string): number {
    return this.feedbackReportRows
      .filter(interviewee => interviewee.position === jobTitle)
      .reduce((count, interviewee) => count + interviewee.pending, 0);
  }

  private maxPendingFeedbackWaitByJob(jobTitle: string): number {
    return this.feedbackReportRows
      .filter(interviewee => interviewee.position === jobTitle && interviewee.pending > 0)
      .reduce((max, interviewee) => Math.max(max, interviewee.waitDays), 0);
  }

  private maxProcessWaitByJob(jobTitle: string): number {
    return (this.trackedApplicantsByJobTitle[jobTitle] ?? [])
      .reduce((max, applicant) => Math.max(max, this.daysSince(applicant.processUpdatedAt || applicant.sentTime)), 0);
  }

  private calculateJobProgress(job: Job): number {
    const applicantCount = this.asNumber(job.applicantCount);
    if (applicantCount === 0) {
      return 0;
    }

    const weightedProgress =
      this.asNumber(job.managerReplied) +
      this.asNumber(job.firstInterview) +
      this.asNumber(job.jointInterview) +
      this.asNumber(job.selectionMeeting) +
      this.asNumber(job.hiredCount) +
      this.asNumber(job.candidateAppointment) +
      this.asNumber(job.onBoarding);

    return Math.min(100, Math.round((weightedProgress / (applicantCount * 7)) * 100));
  }

  private calculateJobConversion(job: Job): number {
    const applicantCount = this.asNumber(job.applicantCount);
    if (applicantCount === 0) {
      return 0;
    }
    return Math.round((this.asNumber(job.managerReplied) / applicantCount) * 100);
  }

  private daysSince(dateValue: string | Date | undefined): number {
    if (!dateValue) {
      return 0;
    }
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return 0;
    }
    const diff = this.reportGeneratedAt.getTime() - date.getTime();
    return Math.max(0, Math.floor(diff / 86400000));
  }

  private riskWeight(riskLevel: RiskLevel): number {
    return riskLevel === '高' ? 3 : riskLevel === '中' ? 2 : 1;
  }

  private asNumber(value: unknown): number {
    const numericValue = Number(value ?? 0);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private downloadCsv(filename: string, rows: CsvCell[][]): void {
    const csv = rows
      .map(row => row.map(value => this.escapeCsv(value)).join(','))
      .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private toIsoDate(value: string | Date | undefined): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  private escapeCsv(value: CsvCell): string {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }
}
