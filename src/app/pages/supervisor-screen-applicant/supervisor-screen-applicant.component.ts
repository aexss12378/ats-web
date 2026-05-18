import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router'; // 
import { ReviewerHeaderComponent } from '../../components/reviewer-header/reviewer-header.component'; //  ReviewerHeaderComponent
import { NavbarComponent } from "../../components/navbar/navbar.component";

// PrimeNG 件
import { ButtonModule } from 'primeng/button'; // 鈕
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { SelectModule } from 'primeng/select'; // 
import { DialogModule } from 'primeng/dialog'; // 互窗
import { ChipModule } from 'primeng/chip';

// import { Service, Interface }
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job.model';
import { Applicant } from '../../models/applicant.model';
import { TrackedApplicantService } from '../../services/tracked-applicant.service';


interface Position {
    label: string;
    value: string;
}

@Component({
  selector: 'app-supervisor-screen-applicant',
  standalone: true,
  imports: [
    CommonModule, //  能 *ngIf, *ngFor
    FormsModule,
    ButtonModule,
    TableModule,
    BadgeModule,
    OverlayBadgeModule,
    SelectModule,
    DialogModule,
    RouterModule,
    ChipModule,
    ReviewerHeaderComponent,
    NavbarComponent
  ],
  templateUrl: './supervisor-screen-applicant.component.html',
  styleUrls: ['./supervisor-screen-applicant.component.css']
})


export class SupervisorScreenApplicantComponent {
  loading = false; // 來示 Loading 
  jobs: Job[] = []; // 從 API 到職缺資漈 Job 刼
  trackedApplicants: any[] = []; //沒義 trackedApplicant 資(Interface)能 any[]
  currentSupervisor = {
    name: '王小明',
    department: '營運部'
  };
  positions: any[] = []; // 組職宼、專案...)
  selectedPosition: string = 'all'; //來職佼 'all'
  showResumeModal = false;
  showSeniorModal = false;
  showRejectModal = false;
  selectedCandidateName = '';
  selectedApplicantId = '';
  selectedResume: any = null;
  seniorOption: string = '否';
  rejectReason = '';
  allApplicants: any[] = [];
  private pendingPositionFromRoute: string | null = null;

  navbar = [
    { label: '應聘者篩選', path: '/supervisor-screen-applicant', icon: 'pi pi-filter' },
    { label: '面試場次', path: '/supervisor-interview', icon: 'pi pi-calendar' },
    { label: '面試評分表', path: '/supervisor-rating', icon: 'pi pi-star' },
    { label: '人選評估', path: '/supervisor-decision', icon: 'pi pi-chart-bar' },
    { label: '人才庫', path: '/talent-pool', icon: 'pi pi-users' }
  ];
  // 建注 JobService  TrackedApplicantService
  constructor(
    private jobService: JobService,
    private trackedApplicantService: TrackedApplicantService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.pendingPositionFromRoute = this.route.snapshot.queryParamMap.get('jobTitle');
    // 誤與 Loading 
    this.loading = true;

    this.jobService.getJobs().subscribe({
      next: (data) => {
        console.log(' 得職缺資:', data);
        this.jobs = data;
        this.updatePositions();
      },
      error: (error) => {
        console.error(' 得職缺資失敗:', error.message);
        if(error.status === 0) {
          console.error('無法連到伺娼確伺');
        }
      },
      complete: () => {
        this.loading = false;
      }
    });

    this.trackedApplicantService.getTrackedApplicants().subscribe({
      next: (data) => {
        console.log(' 得應聘資:', data);
        this.trackedApplicants = data;
        this.updatePositions();
        this.applyRoutePositionFilter();
      },
      error: (error) => {
        console.error(' 得應聘資失敗:', error.message);
        if(error.status === 0) {
          console.error('無法連到伺娼確伺');
        }
      }
    });
  }

  // 畫得資
  // ngOnInit(): void {
  //   //  jobService.getJobs()  API 得所職缺資
  //   this.jobService.getJobs().subscribe(data => {
  //     // 傳 data 進 this.jobs
  //     this.jobs = data;
  //     //  updatePositions() 建職
  //     this.updatePositions();
  //   });

  //   // HR應聘資
  //   this.applicantService.getTrackedApplicants().subscribe(data => {
  //     console.log(' 到資', data);
  //     this.trackedApplicants = data;
  //     this.updatePositions(); //  tracked 資職缺
  //   });
  // }

  updatePositions() {
    //  tracked 資建職缺宼找出複職稱 Set 釼
    const uniqueTitles = [...new Set(this.supervisorApplicants.map(j => j.jobTitle))];
    this.positions = [
      // 部職
      { label: '全部職位', value: 'all' },
      // 轉 <p-select>  { label, value }
      ...uniqueTitles.map(title => ({ label: title, value: title }))
    ];
    this.applyRoutePositionFilter();
  }

  private applyRoutePositionFilter(): void {
    if (
      this.pendingPositionFromRoute
      && this.positions.some(position => position.value === this.pendingPositionFromRoute)
    ) {
      this.selectedPosition = this.pendingPositionFromRoute;
    }
  }

  // getter  selectedPosition 傳應 tracked applicants
  get filteredApplicants() {
    if (this.selectedPosition === 'all') {
      return this.supervisorApplicants;
    }
    return this.supervisorApplicants.filter(j => j.jobTitle === this.selectedPosition);
  }

  getSelectedPositionLabel(): string {
    return this.positions.find(p => p.value === this.selectedPosition)?.label ||this.selectedPosition;
  }

  // 部職缺職缺張表
  getApplicantsByJobTitle(title: string): any[] {
    return this.supervisorApplicants.filter(a => a.jobTitle === title);
  }  //  job 底 applicants 展大列
  extractApplicants() {
    this.allApplicants = this.jobs
      .flatMap(job => job.applicants?.map((app: Applicant) => ({
        ...app,
        jobTitle: job.jobTitle,     // 職缺稱便示
        department: job.department  // 部
      })) || []);
  }

  // getApplicantDetails(applicantName: string, jobTitle: string) {
  //   for (const job of this.jobs) {
  //     if (job.jobTitle === jobTitle) {
  //       const match = job.applicants?.find(app => app.name === applicantName);
  //       if (match) return match;
  //     }
  //   }  //   return null;  // }
  getApplicantDetails(applicantName: string, jobTitle: string): Applicant | null {
    for (const job of this.jobs) {
      if (job.jobTitle === jobTitle) {
        return job.applicants?.find((app: Applicant) =>
          app.name === applicantName || app.name === applicantName
        ) ?? null;
      }
    }
    return null;
  }

  // 職缺badge
  getTrackedCount(jobTitle: string): number {
    return this.supervisorApplicants.filter(app => app.jobTitle === jobTitle).length;
  }

  // resumes: Record<string, any> = {
  //   "": {
  //     position: 'backend',
  //     education: "灣大 資管碩士",
  //     experience: ["2022 - 2024黽", "2020 - 2022HTC"],
  //     skills: "Java, Spring Boot, RESTful API, MySQL",
  //     note: '',
  //     projects: ["製系統與部署", "建置 API Gateway 部"],
  //     intro: "熱架計與效能調桼致穩性與性。"
  //   },
  //   "林育廷": {
  //     position: 'backend',
  //     education: "大 資系碩士",
  //     experience: ["2019 - 2024Shopee"],
  //     skills: "Node.js, Express, MongoDB, Redis",
  //     note: '',
  //     projects: ["商訂模組", "API 效能優與追蹤制計"],
  //     intro: "長高併與資庫計商平驗與性。"
  //   },
  //   "": {
  //     position: 'sre',
  //     education: "灣大 資系碩士",
  //     experience: ["2020 - 2024AmazonSRE "],
  //     skills: "Grafana, Ansible, Docker",
  //     note: '',
  //     projects: ["系統自部署", "資儀表"],
  //     intro: "系統穩性與資管驗長自與建佳。"
  //   },
  //   "黃軒": {
  //     position: 'sre',
  //     education: "治大 系碩士",
  //     experience: ["2021 - 2024IBM平"],
  //     skills: "Prometheus, Linux, Terraform",
  //     note: '',
  //     projects: ["私架建置", "自部署計"],
  //     intro: "專注 DevOps 與整刼追求效能與性平衡。"
  //   },
  //   "佩": {
  //     position: 'sre',
  //     education: "山大 資系碩士",
  //     experience: ["2020 - 2024黽系統"],
  //     skills: "Python, Linux, Grafana",
  //     note: '',
  //     projects: ["資儀表建置與整"],
  //     intro: "長資與系統整刼熱衷資與效。"
  //   }
  // };

  // get resumeKeys(): string[] {
  //   return Object.keys(this.resumes).filter(name =>
  //   this.selectedPosition === 'all' || this.resumes[name].position === this.selectedPosition
  //   );
  // }

  // 物件
  onSelectResume(applicant: any, jobTitle: string) {
    this.selectedCandidateName = applicant.applicantName;
    // this.selectedResume = applicant;

    const baseDetails = this.getApplicantDetails(this.selectedCandidateName, jobTitle);

    console.log('選取應聘者', applicant.applicantName);
    console.log('職稱', jobTitle);
    console.log('追蹤應聘者資料', this.trackedApplicants);

    // 找出職缺與 trackedApplicant 對應資料
    const matched  = this.trackedApplicants
      .filter(t => t.applicantName === applicant.applicantName && t.jobTitle === jobTitle)
      .sort((a, b) => new Date(b.sentTime).getTime() - new Date(a.sentTime).getTime())[0];

    console.log('  matched:', matched);

    // 併資
    this.selectedResume = {
      ...baseDetails,
      id: matched?.id ?? applicant.id,
      jobTitle,
      previousCompany: applicant.previousCompany,
      note: applicant.note,
      englishScore: matched?.englishScore ?? null,
      logicScore: matched?.logicScore ?? null,
      codingScore: matched?.codingScore ?? null
    };
    this.selectedApplicantId = this.selectedResume.id ?? this.selectedCandidateName;

    this.showResumeModal = true;
  }

  onCloseResumeModal(): void {
    this.showResumeModal = false;
    if (!this.showSeniorModal && !this.showRejectModal) {
      this.clearSelection();
    }
  }

  // 開啟邀請設定
  onInvite() {
    this.showResumeModal = false;
    this.showSeniorModal = true;
  }
  // 婉拒人選
  onReject(): void {
    this.showResumeModal = false;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  onConfirmInvite(option: string): void {
    const applicantId = this.getSelectedApplicantId();
    if (applicantId) {
      const reviewedAt = new Date().toISOString();
      this.trackedApplicantService.updateTrackedApplicantProcess(applicantId, {
        processStepId: 4,
        stepStatus: '進行中',
        taskStatus: '待寄面試邀請',
        initialReviewStatus: 'Passed Initial Screening',
        status: '主管確認',
        managerRespondedAt: reviewedAt,
        processUpdatedAt: reviewedAt,
        supervisorConfirmed: true
      }).subscribe({
        next: () => {
          this.trackedApplicantService.saveSupervisorAction(applicantId, 'invite', `邀請面試，資深人員身分：${option}`).subscribe();
          this.trackedApplicants = this.trackedApplicants.filter(applicant => applicant.id !== applicantId);
          this.updatePositions();
          alert(`已通知 HR 安排 ${this.selectedCandidateName}\n資深人員身分：${option}`);
          this.showSeniorModal = false;
          this.clearSelection();
        },
        error: () => alert('邀請面試失敗，請稍後再試')
      });
    }
  }

  onCancelInvite() {
    this.showSeniorModal = false;
    this.clearSelection();
  }

  onConfirmReject(): void {
    const reason = this.rejectReason.trim();
    const applicantId = this.getSelectedApplicantId();

    if (!reason) {
      alert('請輸入婉拒原因');
      return;
    }

    if (applicantId) {
      this.trackedApplicantService.saveSupervisorAction(applicantId, 'reject', reason).subscribe({
        next: () => {
          alert(`已婉拒 ${this.selectedCandidateName}\n原因：${reason}`);
          this.showRejectModal = false;
          this.clearSelection();
        },
        error: () => alert('婉拒紀錄儲存失敗，請稍後再試')
      });
    }
  }

  onCancelReject(): void {
    this.showRejectModal = false;
    this.clearSelection();
  }

  private getSelectedApplicantId(): string {
    return this.selectedResume?.id ?? this.selectedApplicantId ?? this.selectedCandidateName;
  }

  private clearSelection(): void {
    this.selectedResume = null;
    this.selectedCandidateName = '';
    this.selectedApplicantId = '';
    this.rejectReason = '';
    this.seniorOption = '否';
  }

  private get supervisorApplicants(): any[] {
    return this.trackedApplicants.filter(applicant =>
      this.getApplicantSupervisor(applicant) === this.currentSupervisor.name
    );
  }

  private getApplicantSupervisor(applicant: any): string {
    return applicant.supervisor || this.findJobManager(applicant.jobTitle) || '未指派';
  }

  private findJobManager(jobTitle: string): string | undefined {
    return this.jobs.find(job => job.jobTitle === jobTitle)?.manager;
  }
}
