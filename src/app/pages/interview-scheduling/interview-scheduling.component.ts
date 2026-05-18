import { TrackedApplicantService } from './../../services/tracked-applicant.service';
import { JobService } from './../../services/job.service';
import { InterviewService } from './../../services/interview.service';
import { InterviewSession } from './../../models/interview.model';
import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { TabsComponent } from '../../components/tabs/tabs.component';
import { TimelineModule } from 'primeng/timeline';
import { PanelModule } from 'primeng/panel';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';

interface Interviewer {
  name: string;
  department: string;
}


@Component({
  selector: 'app-interview-scheduling',
  imports: [HeaderComponent, TabsComponent, TimelineModule, PanelModule, CommonModule, SelectModule, FormsModule, DatePickerModule, ButtonModule],
  templateUrl: './interview-scheduling.component.html',
  styleUrl: './interview-scheduling.component.css'
})
export class InterviewSchedulingComponent {

  constructor(private interviewService: InterviewService, private jobService: JobService, private trackedApplicantService: TrackedApplicantService) {}

  steps = [
    { label: '職缺與輪次', completed: false },
    { label: '應徵者', completed: false },
    { label: '面試官', completed: false },
    { label: '時間與地點', completed: false },
    { label: '確認送出', completed: false }
  ];

  interviewRounds = [
    { label: '第一輪面試', value: 1 },
    { label: '第二輪面試', value: 2 },
    { label: '最終面試', value: 3 },
  ];

  locations = [
    { label: '台北總部 - 會議室A', value: 'A' },
    { label: '台北總部 - 會議室B', value: 'B' },
    { label: '線上會議', value: 'Online' },
  ];

  jobOptions: any[] = [];
  selectedJob: any = null;
  selectedRound: any = null;
  selectedApplicants: any[] = [];
  applicantsToSchedule: any[] = [];
  interviewerOptions: any[] = [];
  selectedInterviewers: any[] = [];
  interviewDate: Date | null = null;
  interviewTime: Date | null = null;
  selectedLocation: string = '';


  ngOnInit(): void {
    this.loadOpenJobs();
    this.loadInterviewers();
  }

  loadOpenJobs() {
    this.jobService.getOpenJobs().subscribe(jobs => {
      this.jobOptions = jobs.map(job => ({
        label: `${job.jobTitle}（${job.department}）`,
        value: job
      }));
    });
  }

  loadInterviewers() {
    this.interviewService.getInterviewers().subscribe(data => {
      this.interviewerOptions = data;
    });
  }

  handleSelectionChange() {
    const jobSelected = !!this.selectedJob;
    const roundSelected = this.selectedRound !== null && this.selectedRound !== undefined;

    // 第
    this.steps[0].completed = jobSelected && roundSelected;    // 都了就撈人資
    if (jobSelected && roundSelected) {
      const jobTitle = this.selectedJob.value.jobTitle;
      const roundToProcessStep: { [round: number]: number } = {
        1: 4,
        2: 5,
        3: 6
      };
      const currentStep = roundToProcessStep[this.selectedRound];

      this.trackedApplicantService.getTrackedApplicantsByJobAndStep(jobTitle, currentStep).subscribe(applicants => {
        this.selectedApplicants = applicants; // 儲撈來人
        console.log('API 傳資', this.selectedApplicants);
      });
    }
  }

  checkApplicants() {
    this.applicantsToSchedule = this.selectedApplicants.filter(applicant => applicant.selected);
    this.steps[1].completed = this.applicantsToSchedule.length > 0;
  }

  toggleInterviewer(i: Interviewer) {
    const index = this.selectedInterviewers.findIndex(sel => sel.name === i.name);
    if (index > -1) {
      this.selectedInterviewers.splice(index, 1); // 消
    } else if (this.selectedInterviewers.length < 3) {
      this.selectedInterviewers.push(i); // 
    }
    this.steps[2].completed = this.selectedInterviewers.length === 3;
  }

  isSelected(i: Interviewer): boolean {
    return this.selectedInterviewers.some(sel => sel.name === i.name);
  }

  getBadgeClass(dept: string): string {
    switch (dept) {
      case '技術部': return 'bg-blue-200 text-blue-700';
      case '人資部': return 'bg-green-200 text-green-700';
      case '營運部': return 'bg-purple-200 text-purple-700';
      case '設計部': return 'bg-pink-200 text-pink-700';
      default: return 'bg-gray-200 text-gray-700';
    }
  }


  checkScheduleComplete() {
    const dateOk = !!this.interviewDate;
    const timeOk = !!this.interviewTime;
    const locationOk = !!this.selectedLocation;

    this.steps[3].completed = dateOk && timeOk && locationOk;
  }


  createInterviewSession() {
    const scheduledTime = this.getScheduledTimeISO();

    if (
      this.selectedRound === null ||
      !scheduledTime ||
      !this.selectedLocation ||
      this.selectedInterviewers.length !== 3 ||
      this.applicantsToSchedule.length === 0
    ) {
      alert('請確認所有欄位已完整填寫');
      return;
    }

    const selectedLocationOption = this.locations.find(location => location.value === this.selectedLocation);
    const feedbackDeadline = this.getFeedbackDeadlineISO(scheduledTime);

    const scheduledApplicant = this.applicantsToSchedule[0];
    const sessionId = `session-${Date.now()}`;
    const payload: InterviewSession = {
      id: sessionId,
      round: this.selectedRound,
      scheduledTime,
      location: selectedLocationOption ?? this.selectedLocation,
      interviewerIds: this.selectedInterviewers.map(i => i.id),
      applicantId: scheduledApplicant.id,
      notes: this.buildInterviewNotes(scheduledApplicant),
      feedbacks: this.selectedInterviewers.map(interviewer => ({
        interviewerId: interviewer.id,
        comment: '尚未提交，等待面試官補上評語。',
        submitted: false,
        waitDays: 0
      })),
      feedbackDeadline,
      allFeedbacksReceived: false
    };
    console.log('要送出的資料：', payload);

    this.interviewService.createInterviewSession(payload).subscribe(() => {
      this.trackedApplicantService.updateTrackedApplicantProcess(scheduledApplicant.id, {
        processStepId: 4,
        stepStatus: '進行中',
        taskStatus: '已完成',
        initialReviewStatus: 'Passed Initial Screening',
        status: '一面安排完成',
        processUpdatedAt: new Date().toISOString(),
        supervisorConfirmed: true,
        interviewSessionId: sessionId
      }).subscribe(() => {
        alert('面試場次已建立，候選人流程已同步更新');
        this.selectedApplicants = this.selectedApplicants.filter(applicant => applicant.id !== scheduledApplicant.id);
        this.applicantsToSchedule = [];
        this.steps[1].completed = false;
      });
    });
  }

  getScheduledTimeISO(): string | null {
    if (!this.interviewDate || !this.interviewTime) {
      return null;
    }

    const date = new Date(this.interviewDate);
    const time = new Date(this.interviewTime);

    // 將時間套用到日期物件
    date.setHours(time.getHours(), time.getMinutes(), 0, 0);

    return date.toISOString();
  }

  private getFeedbackDeadlineISO(scheduledTime: string): string {
    const deadline = new Date(scheduledTime);
    deadline.setDate(deadline.getDate() + 2);
    deadline.setHours(18, 0, 0, 0);
    return deadline.toISOString();
  }

  private buildInterviewNotes(applicant: any): string {
    const jobTitle = this.selectedJob?.value?.jobTitle ?? applicant.jobTitle ?? '此職缺';
    return `一面，重點確認 ${jobTitle} 經驗、跨部門溝通與專案推進能力。`;
  }




}
