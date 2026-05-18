import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { TabsComponent } from '../../components/tabs/tabs.component';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TooltipModule } from 'primeng/tooltip';
import { RouterModule } from '@angular/router';
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job.model';
import { ApplicantService } from '../../services/applicant.service';
import { Applicant } from '../../models/applicant.model';
import { TrackedApplicantService } from '../../services/tracked-applicant.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-resume-screening',
  imports: [HeaderComponent, TabsComponent, CommonModule, RouterModule, TableModule, ButtonModule, DropdownModule, TagModule, MenuModule, SplitButtonModule, TooltipModule],
  templateUrl: './resume-screening.component.html',
  styleUrl: './resume-screening.component.css'
})


export class ResumeScreeningComponent {

  jobList: Job[] = [];
  expandedRows: { [key: string]: boolean } = {};
  currentJobTitle: string = '';
  selectedApplicants: any[] = [];

  get openJobCount(): number {
    return this.jobList.filter(job => this.getJobStatus(job) === '招募中').length;
  }

  get totalApplicantCount(): number {
    return this.jobList.reduce((sum, job) => sum + this.getApplicantCount(job), 0);
  }

  get reviewableApplicantCount(): number {
    return this.jobList
      .filter(job => !this.isJobClosed(job))
      .reduce((sum, job) => sum + this.getApplicantCount(job), 0);
  }

  get readyToImportCount(): number {
    return this.selectedApplicants.length;
  }

  constructor(
    private jobService: JobService,
    private applicantService: ApplicantService,
    private trackedApplicantService: TrackedApplicantService
  ) {}

  ngOnInit() {
    // 初始化展開列狀態
    this.expandedRows = {};
    this.loadJobs();
  }

  // 載入職缺列表與內嵌應徵者資料
  loadJobs() {
    this.jobService.getJobs().subscribe({
      next: (jobs) => {
        if (!jobs || jobs.length === 0) {
          this.jobList = [];
          return;
        }

        // 保留 db.json 內嵌在職缺底下的應徵者資料，讓 demo 不需要額外後端也能呈現完整流程。
        this.jobList = jobs.map(job => ({
          ...job,
          jobStatus: job.jobStatus ?? (job as any).status,
          applicants: this.normalizeApplicantsForJob(job),
          applicantCount: job.applicantCount ?? job.applicants?.length ?? 0
        }));
      },
      error: (error) => {
        console.error('載入職缺資料失敗:', error);
        this.jobList = [];
      }
    });
  }

  // 展開職缺時，若沒有內嵌應徵者資料，再向服務補查
  onJobRowExpand(job: Job) {
    if (!job.applicants || job.applicants.length === 0) {
      this.loadApplicantsForJob(job);
    }
  }

  // 載入指定職缺的應徵者資料
  loadApplicantsForJob(job: Job) {
    this.applicantService.getApplicantsByJob(String(job.id ?? '')).subscribe({
      next: (applicants: Applicant[]) => {
        // 更新該職缺的應徵者資料
        const jobIndex = this.jobList.findIndex(j => j.id === job.id);
        if (jobIndex !== -1) {
          const updatedJob = {
            ...this.jobList[jobIndex],
            applicants
          };

          this.jobList[jobIndex] = {
            ...updatedJob,
            applicants: this.normalizeApplicantsForJob(updatedJob),
            applicantCount: applicants.length
          };
        }
      },
      error: (error) => {
        console.error(`載入職缺 "${job.jobTitle}" 的應徵者資料失敗:`, error);
        // 即使失敗，也讓 UI 顯示 0 位應徵者
        const jobIndex = this.jobList.findIndex(j => j.id === job.id);
        if (jobIndex !== -1) {
          this.jobList[jobIndex] = {
            ...this.jobList[jobIndex],
            applicants: [],
            applicantCount: 0
          };
        }
      }
    });
  }

  // 記錄目前選取的職缺
  setCurrentJob(job: Job) {
    this.currentJobTitle = job.jobTitle;
  }

  getJobStatus(job: Job): string {
    return job.jobStatus ?? (job as any).status ?? '尚無資料';
  }

  getApplicantCount(job: Job): number {
    return Number(job.applicantCount ?? job.applicants?.length ?? 0);
  }

  getJobStatusTone(job: Job): string {
    const status = this.getJobStatus(job);

    if (status === '已關閉') {
      return 'closed';
    }

    if (status === 'urgent') {
      return 'warning';
    }

    return 'active';
  }

  isJobClosed(job: Job): boolean {
    return this.getJobStatus(job) === '已關閉';
  }

  closeJob(job: Job) {
    if (!job.id || this.isJobClosed(job)) {
      return;
    }

    const confirmed = confirm(`確定要關閉「${job.jobTitle}」嗎？關閉後會保留既有應徵者資料，但此職缺不再列為招募中。`);
    if (!confirmed) {
      return;
    }

    this.jobService.updateJobStatus(job.id, '已關閉').subscribe({
      next: (updatedJob) => {
        const jobIndex = this.jobList.findIndex(item => item.id === job.id);
        if (jobIndex === -1) {
          return;
        }

        this.jobList[jobIndex] = {
          ...this.jobList[jobIndex],
          ...updatedJob,
          jobStatus: updatedJob.jobStatus ?? (updatedJob as any).status ?? '已關閉'
        };
      },
      error: (error) => {
        console.error('關閉職缺失敗:', error);
        alert('關閉職缺失敗，請稍後再試');
      }
    });
  }

  importToDashboard() {
    if (!this.selectedApplicants.length) {
      alert('請先選擇要送出的應徵者');
      return;
    }

    if (!this.currentJobTitle) {
      alert('無法取得職缺名稱，請先展開職缺資料');
      return;
    }

    // 送出選取的應徵者，改用 firstValueFrom 避免舊式 Promise 轉換。
    firstValueFrom(
      this.trackedApplicantService.createTrackedApplicants(this.selectedApplicants)
    ).then(() => {
      alert(`已送出 ${this.selectedApplicants.length} 位應徵者到主管追蹤清單`);
      this.selectedApplicants = [];
    }).catch(error => {
      console.error('送出失敗:', error);
      alert('送出失敗，請稍後再試');
    });
  }

  private normalizeApplicantsForJob(job: Job): any[] {
    return (job.applicants ?? []).map((applicant: any, index: number) => ({
      ...applicant,
      applicantId: applicant.applicantId ?? `${job.id}-${index + 1}`,
      jobId: applicant.jobId ?? job.id,
      jobTitle: applicant.jobTitle ?? job.jobTitle,
      supervisor: applicant.supervisor ?? job.manager ?? '未指派'
    }));
  }

}
