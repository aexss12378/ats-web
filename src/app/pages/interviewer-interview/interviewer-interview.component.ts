import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // 
import { ReviewerHeaderComponent } from '../../components/reviewer-header/reviewer-header.component';
import { NavbarComponent } from '../../components/navbar/navbar.component'; //  NavbarComponent
import { DatePipe } from '@angular/common'; // 

// PrimeNG 件
import { ButtonModule } from 'primeng/button'; // 鈕
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { SelectModule } from 'primeng/select'; // 
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog'; // 互窗
import { ChipModule } from 'primeng/chip'; //籤

// import { Service, Interface }
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job.model';
import { TrackedApplicantService } from '../../services/tracked-applicant.service';
import { InterviewService } from '../../services/interview.service';
import { forkJoin } from 'rxjs';

// 義來儲應聘資
interface ApplicantData {
  education: string;
  experience: number;
  previousCompany: string;
  skills: string;
}

interface Position {
  label: string;
  value: string;
}

// 義
interface Feedback {
  interviewerId: string | number;
  // ... feedback 屬性
}


@Component({
  selector: 'app-interviewer-interview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReviewerHeaderComponent,
    NavbarComponent,
    ButtonModule,
    TableModule,
    BadgeModule,
    SelectModule,
    SelectButtonModule,
    DialogModule,
    ChipModule
  ],
  templateUrl: './interviewer-interview.component.html',
  styleUrl: './interviewer-interview.component.css',
  providers: [DatePipe] //  DatePipe 
})

export class InterviewerInterviewComponent {
  allApplicants: any[] = []; // 所應聘資
  interviewSessions: any[] = []; // 從 API 到資
  trackedApplicants: any[] = []; // 應聘資
  interviewers: any[] = []; // 從 API 到官資漈 Interviewer 
  currentInterviewer: any = null; // 當官資
  positions: Position[] = []; // 職資
  selectedPosition: string = 'all';
  selectedFilter = 'all';
  filterBySupervisor: boolean = false;
  filteredInterviews: any[] = []; // 儲資
  showResumeModal = false;
  selectedCandidateName = '';
  selectedResume: any = null;

  navbar = [
    { label: '面試場次', path: '/interviewer-interview', icon: 'pi pi-calendar' },
    { label: '面試評分表', path: '/interviewer-rating', icon: 'pi pi-star' },
    { label: '人才庫', path: '/talent-pool', icon: 'pi pi-users' }
  ];
  // 建注 Service從 json-server  API 得職缺資
  constructor(
    private jobService: JobService,
    private trackedApplicantService: TrackedApplicantService,
    private interviewService: InterviewService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    // 載官資
    this.loadInterviewers();

    // 官資載載資
    this.interviewService.getInterviewers().subscribe({
      next: (interviewers) => {
        this.interviewers = interviewers;

        // 置當官
        const interviewer = this.interviewers.find(i => i.id === '1');        if (interviewer) {
          this.currentInterviewer = interviewer;
        }

        // 載資
        forkJoin({
          jobs: this.jobService.getJobs(),
          interviews: this.interviewService.getInterviewSessions(),
          applicants: this.trackedApplicantService.getTrackedApplicants()
        }).subscribe({
          next: (data) => {
            this.allApplicants = data.jobs;
            this.interviewSessions = data.interviews;
            this.trackedApplicants = data.applicants;
            // 所資都載職
            this.positions = this.getAvailablePositions();
            this.onFilterChange();
          },
          error: (err) => console.error('資載誤', err)
        });
      },
      error: (err) => console.error('官資載誤', err)
    });
  }

  // 得當官資
  loadInterviewers(): void {
    this.interviewService.getInterviewers().subscribe(data => {
      console.log(' 官資', data);
      this.interviewers = data;

      // 出王小明(id=1)為當官
      const interviewer = this.interviewers.find(interviewer => interviewer.id === '1');
      if (interviewer) {
        this.currentInterviewer = interviewer;
      }
    });
  }

  // 資
  // interviews  = [
  //   {
  //     date: '3/17',
  //     time: '9:30',
  //     room: '6-4 館',
  //     interviewers: ['Leo', 'Louis', 'Richard'],
  //     candidate: '宇',
  //     education: '灣大 資碩士',
  //     experience: 5,
  //     previousCompany: 'Google',
  //     skills: 'Python, SQL, Apache Spark',
  //     note: '',
  //     position: 'data',
  //     supervisor: '張',
  //     workExperience: ["2019 - 2024Google"],
  //     projects: ["資倉儲整專案 - 使 Apache Spark 進跨資與刼表出效 40%", "ML 資自系統 -  Python ETL pipeline資與練平"],
  //     intro: "資滿熱惼長大模資與建高效能資管。能貴所長資架穩與效。",
  //   },
  //   {
  //     date: '3/17',
  //     time: '10:30',
  //     room: '6-4 館',
  //     interviewers: ['Leo', 'Louis', 'Richard'],
  //     candidate: '林涵',
  //     education: '大 資管士',
  //     experience: 3,
  //     previousCompany: 'LINE',
  //     skills: 'BigQuery, Tableau, ETL',
  //     note: '',
  //     position: 'data',
  //     supervisor: '張',
  //     workExperience: ["2021 - 2024LINE"],
  //     projects: ["儀表建置專案利 BigQuery 分戶為資整 Tableau 表", "ETL 效能優專案"],
  //     intro: "資分與管整能能快進洞與決。貢分與整驗。",
  //   },
  //   {
  //     date: '3/17',
  //     time: '11:30',
  //     room: '6-4 館',
  //     interviewers: ['Leo', 'Richard', 'Kevin'],
  //     candidate: '張嘉豪',
  //     education: '交大 資碩士',
  //     experience: 4,
  //     previousCompany: 'Facebook',
  //     skills: 'Kafka, Airflow, AWS Redshift',
  //     note: '',
  //     position: 'data',
  //     supervisor: '',
  //     workExperience: ["2020 - 2024Facebook 資"],
  //     projects: ["Kafka 分散件流平 - 計高 Kafka 架槼部資流傳", "Airflow 任與示系統 - 建置 DAG 制自記示異"],
  //     intro: "長建置高資平尼悉資流與自流計環境戰大模資平建。",
  //   },
  // ];

  getCurrentInterviewerInterviewCount(): number {
    if (!this.interviewSessions?.length || !this.currentInterviewer) return 0;

    return this.interviewSessions.filter(session =>
      session.feedbacks?.some((feedback: Feedback) =>
        feedback.interviewerId === this.currentInterviewer.id
      )
    ).length;
  }

  onSelectPosition(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedPosition = target.value;
  }

  // 得所複職佼職
  getAvailablePositions(): Position[] {
    // "部職"
    const positions: Position[] = [
      { label: '全部職位', value: 'all' }
    ];

    // 當當官繼
    if (!this.currentInterviewer) {
      return positions;
    }

    const currentInterviewerId = this.currentInterviewer.id;
    // 從 trackedApplicants 得所職
    const uniquePositions = new Set<string>();

    // 濾出當官次
    const relevantSessions = this.interviewSessions.filter(session =>
      session.feedbacks.some((feedback: Feedback) =>
        feedback.interviewerId === currentInterviewerId
      )
    );

    // 從次得職
    relevantSessions.forEach(session => {
      const applicant = this.trackedApplicants.find(app =>
        app.id === session.applicantId
      );
      if (applicant && applicant.jobTitle) {
        uniquePositions.add(applicant.jobTitle);
      }
    });

    // 將職
    Array.from(uniquePositions).sort().forEach(title => {
      positions.push({
        label: title,
        value: title.toLowerCase().replace(/\s+/g, '_')
      });
    });

    console.log('當官職', positions);
    return positions;
  }

  //  InterviewSession 得應 JobTitle
  getJobTitleByInterviewSession(session: any): string {
    if (!session) return '職';

    // 從 trackedApplicants 找到應應聘
    const applicant = this.trackedApplicants.find(app =>
      app.id === session.applicantId
    );
    if (!applicant) return '職';

    // 從 allApplicants (jobs) 找到應職缺
    const job = this.allApplicants.find((job: any) =>
      job.applicants?.some((app: any) => app.name === applicant.applicantName)
    );

    return job ? job.jobTitle : '職';
  }

  // 職分組次濾特官次
  groupInterviewsByJobTitle(): { [key: string]: any[] } {
    const groups: { [key: string]: any[] } = {};

    // 當官次
    const currentInterviewerId = this.currentInterviewer?.id;

    const filteredSessions = this.interviewSessions.filter(session => {
      // 檢該次 feedbacks 當官
      return session.feedbacks.some((feedback: Feedback) =>
        feedback.interviewerId === currentInterviewerId
      );
    });

    // 將濾次職分組
    filteredSessions.forEach(session => {
      const jobTitle = this.getJobTitleByInterviewSession(session);
      if (!groups[jobTitle]) {
        groups[jobTitle] = [];
      }
      groups[jobTitle].push(session);
    });

    return groups;
  }

  // 將 ISO 轉為
  getFormattedDate(scheduledTime: string): string | null {
    return this.datePipe.transform(scheduledTime, 'MM-dd'); // 為 "05-27"
  }

  // 將 ISO 轉為
  getFormattedTime(scheduledTime: string): string {
    return this.datePipe.transform(scheduledTime, 'HH:mm') ?? '';
  }

  // 得應聘詳細資
  getApplicantDetails(applicantId: string) {
    // 傳 interviewSessions.applicantId  trackedApplicants 列找應聘所資
    const trackedApplicant = this.trackedApplicants.find(
      app => app.id === applicantId
    );
    if (!trackedApplicant) return null;

    // 從 allApplicants  jobs 列找到應職缺資
    const job = this.allApplicants.find((job: any) =>
      job.applicants?.some((app: any) => app.name === trackedApplicant.applicantName)
    );

    // 從 jobs 找到應 applicants 資
    const applicant = job?.applicants?.find(
      (app: any) => app.name === trackedApplicant.applicantName
    );

    // 併資垼函示就裡到所資
    return {
      ...trackedApplicant,
      ...applicant
    };
  }

  // 職徼濾資
  onFilterChange(): void {
    if (!this.currentInterviewer) return;

    const currentInterviewerId = this.currentInterviewer.id;

    // 濾出當官次
    this.filteredInterviews = this.interviewSessions
      .filter(session =>
        session.feedbacks.some((feedback: Feedback) =>
          feedback.interviewerId === currentInterviewerId
        )
      )
      .map(session => {
        const applicant = this.getApplicantDetails(session.applicantId);
        return {
          date: this.datePipe.transform(session.scheduledTime, 'MM/dd'),
          time: this.datePipe.transform(session.scheduledTime, 'HH:mm'),
          room: session.location.label,
          candidate: applicant?.name || '',
          education: applicant?.education || '',
          experience: applicant?.experience || 0,
          previousCompany: applicant?.previousCompany || '',
          skills: applicant?.skills?.join(', ') || '',
          notes: ''
        };
      });

    // 特職佼進職濾
    if (this.selectedPosition && this.selectedPosition !== 'all') {
      this.filteredInterviews = this.filteredInterviews.filter(interview => {
        const jobTitleValue = interview.jobTitle?.toLowerCase().replace(/\s+/g, '_');
        return jobTitleValue === this.selectedPosition;
      });
    }
  }

  getCountByPosition(position: string): number {
    return this.filteredInterviews.filter(i => i.position === position).length;
  }

  onSelectResume(applicantId: string) {
    const resume = this.getApplicantDetails(applicantId);
    this.selectedCandidateName = resume?.name || resume?.applicantName || '應聘';
    this.selectedResume = resume ? {
      ...resume,
      skills: Array.isArray(resume.skills) ? resume.skills.join(', ') : resume.skills,
      workExperience: resume.workExperience || [],
      projects: resume.projects || []
    } : null;
    this.showResumeModal = true;
  }

  onCloseResumeModal(): void {
    this.showResumeModal = false;
    this.selectedResume = null;
  }
}
