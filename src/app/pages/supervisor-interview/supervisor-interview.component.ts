  import { Component } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { RouterModule, ActivatedRoute } from '@angular/router';
  import { ReviewerHeaderComponent } from '../../components/reviewer-header/reviewer-header.component';
  import { NavbarComponent } from '../../components/navbar/navbar.component'; //  NavbarComponent
  import { DatePipe } from '@angular/common'; // 

  // PrimeNG 件
  import { ButtonModule } from 'primeng/button'; // 鈕
  import { TableModule } from 'primeng/table';
  import { BadgeModule } from 'primeng/badge';
  import { SelectModule } from 'primeng/select'; // 
  import { SelectButtonModule } from 'primeng/selectbutton';
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

  @Component({
    selector: 'app-supervisor-interview',
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
      SelectButtonModule
    ],
    templateUrl: './supervisor-interview.component.html',
    styleUrls: ['./supervisor-interview.component.css'],
    providers: [DatePipe] //  裡 DatePipe
  })

  export class SupervisorInterviewComponent {
    private originalInterviewSessions: any[] = []; // 儲資
    interviewSessions: any[] = []; // 從 API 到資漈 InterviewSession 刼
    interviewers: any[] = []; // 從 API 到官資漈 Interviewer 
    currentSupervisor: any = null; // 當管資
    trackedApplicants: any[] = []; // 應聘資
    allApplicants: any[] = []; // 所應聘資
    positions: Position[] = []; // 職資
    selectedPosition: string = 'all';
    selectedFilter: string = 'all';
    filterBySupervisor: boolean = false;
    showResumeModal = false;
    selectedCandidateName = '';
    selectedResume: any = null;

    get navbar() {
      return [
        { label: '應聘者篩選', path: '/supervisor-screen-applicant', icon: 'pi pi-filter' },
        { label: '面試場次', path: `/supervisor-interview/${this.supervisorId}`, icon: 'pi pi-calendar' },
        { label: '面試評分表', path: '/supervisor-rating', icon: 'pi pi-star' },
        { label: '人選評估', path: '/supervisor-decision', icon: 'pi pi-chart-bar' },
        { label: '人才庫', path: '/talent-pool', icon: 'pi pi-users' }
      ];
    }

    interviewFilters = [
      { label: '全部面試', value: 'all' },
      { label: '主管面試', value: 'supervisor' }
    ];
    supervisorId: string = '1';

    constructor(
      private route: ActivatedRoute,
      private jobService: JobService,
      private trackedApplicantService: TrackedApplicantService,
      private interviewService: InterviewService,
      private datePipe: DatePipe
    ) {}

    ngOnInit() {
      this.supervisorId = this.route.snapshot.paramMap.get('supervisorId') ?? '1';
      // 使 forkJoin 確資載
      forkJoin({
        jobs: this.jobService.getJobs(),
        interviews: this.interviewService.getInterviewSessions(),
        applicants: this.trackedApplicantService.getTrackedApplicants()
      }).subscribe({
        next: (data) => {
          this.allApplicants = data.jobs;
          this.interviewSessions = data.interviews;
          this.originalInterviewSessions = [...data.interviews]; // 深資避濾資遺失
          this.trackedApplicants = data.applicants; // 所資都載職
          this.positions = this.getAvailablePositions();
          console.log('職佼', this.positions);
        },
        error: (err) => console.error('資載誤', err)
      });

      // 載官資
      this.loadInterviewers();

      // this.onFilterChange(); // 載次

      // 得資
      // this.interviewService.getInterviewSessions().subscribe(data => {
      //   console.log(' 到資', data);
      //   this.interviewSessions = data;
      //   this.positions = this.getAvailablePositions(); // 得資職
      // });

      // // 得官資
      // this.interviewService.getInterviewers().subscribe(data => {
      //   console.log(' 到資', data);
      //   this.interviewers = data;
      // });

      // // 得官資
      // this.loadInterviewers();

      // // 得應聘資
      // this.applicantService.getTrackedApplicants().subscribe(data => {
      //   this.trackedApplicants = data;
      // });

      // 得職缺資為從裡撈 data
      // this.jobService.getJobs().subscribe(data => {
      //   this.allApplicants = data;
      // });
    }

    loadInterviewers(): void {
      this.interviewService.getInterviewers().subscribe(data => {
        this.interviewers = data;
        const supervisor = this.interviewers.find(i => i.id === this.supervisorId);
        if (supervisor) {
          this.currentSupervisor = supervisor;
        }
      });
    }

    interviews  = [
      {
        date: '3/17',
        time: '9:30',
        room: '6-4 館',
        interviewers: ['Leo', 'Louis', 'Richard'],
        candidate: '宇',
        education: '灣大 資碩士',
        experience: 5,
        previousCompany: 'Google',
        skills: 'Python, SQL, Apache Spark',
        note: '',
        position: 'data',
        supervisor: '張',
        workExperience: ["2019 - 2024Google"],
        projects: ["資倉儲整專案 - 使 Apache Spark 進跨資與刼表出效 40%", "ML 資自系統 -  Python ETL pipeline資與練平"],
        intro: "資滿熱惼長大模資與建高效能資管。能貴所長資架穩與效。",
      },
      {
        date: '3/17',
        time: '10:30',
        room: '6-4 館',
        interviewers: ['Leo', 'Louis', 'Richard'],
        candidate: '林涵',
        education: '大 資管士',
        experience: 3,
        previousCompany: 'LINE',
        skills: 'BigQuery, Tableau, ETL',
        note: '',
        position: 'data',
        supervisor: '張',
        workExperience: ["2021 - 2024LINE"],
        projects: ["儀表建置專案利 BigQuery 分戶為資整 Tableau 表", "ETL 效能優專案"],
        intro: "資分與管整能能快進洞與決。貢分與整驗。",
      },
      {
        date: '3/17',
        time: '11:30',
        room: '6-4 館',
        interviewers: ['Leo', 'Richard', 'Kevin'],
        candidate: '張嘉豪',
        education: '交大 資碩士',
        experience: 4,
        previousCompany: 'Facebook',
        skills: 'Kafka, Airflow, AWS Redshift',
        note: '',
        position: 'data',
        supervisor: '',
        workExperience: ["2020 - 2024Facebook 資"],
        projects: ["Kafka 分散件流平 - 計高 Kafka 架槼部資流傳", "Airflow 任與示系統 - 建置 DAG 制自記示異"],
        intro: "長建置高資平尼悉資流與自流計環境戰大模資平建。",
      }
    ];

    get filteredList() {
      return this.interviews .filter(row => {
        const matchPosition = this.selectedPosition === 'all' || row.position === this.selectedPosition;
        const matchSupervisor = !this.filterBySupervisor || row.interviewers.includes('Louis');
        return matchPosition && matchSupervisor;
      });
    }

    onSelectPosition(event: Event) {
      const target = event.target as HTMLSelectElement;
      this.selectedPosition = target.value;
    }

    // 得所複職
    getAvailablePositions(): Position[] {
      // "部職"
      const positions: Position[] = [
        { label: '全部職位', value: 'all' }
      ];

      // 從 trackedApplicants 得所職
      const uniquePositions = new Set<string>();

      this.trackedApplicants.forEach(applicant => {
        // 檢應聘次
        const hasInterview = this.interviewSessions.some(
          session => session.applicantId === applicant.id
        );

        if (hasInterview && applicant.jobTitle) {
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

      console.log('職', positions);
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

    // 職分組次
    groupInterviewsByJobTitle(): { [key: string]: any[] } {
      const groups: { [key: string]: any[] } = {};

      this.interviewSessions.forEach(session => {
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

    // 從 applicantId  trackedApplicants 資
    getApplicantNameById(applicantId: string): string {
      // 從 trackedApplicants 得 id 應 interviewSessions.applicantId
      const applicant = this.trackedApplicants.find(app => app.id === applicantId);
      return applicant ? applicant.applicantName : '應聘';
    }

    // 從 applicantId  trackedApplicants  id從 jobs 找到應資
    // 傳 ApplicantData 物件還裡資
    getApplicantDataById(applicantId: string): ApplicantData {
      // 1. 值
      const defaultData: ApplicantData = {
        education: '',
        experience: 0,
        previousCompany: '',
        skills: '能'
      };

      // 2. 從 trackedApplicants 找到應應聘
      const applicant = this.trackedApplicants.find(app => app.id === applicantId);
      if (!applicant) return defaultData;

      // 3. 從 jobs 找到應職缺
      const job = this.allApplicants.find((job: any) =>
        job.applicants?.some((app: any) => app.name === applicant.applicantName)
      );
      if (!job) return defaultData;

      // 4. 從職缺 applicants 找到應應聘資
      const applicantData = job.applicants.find((app: any) => app.name === applicant.applicantName);
      if (!applicantData) return defaultData;

      // 5. 傳找到資
      return {
        education: applicantData.education,
        experience: applicantData.experience,
        previousCompany: applicantData.previousCompany,
        skills: applicantData.skills
      };
    }

    filteredInterviews = this.interviews;

    // 職徼濾資
    onFilterChange(): void {
      // 恢復資(部次)
      this.interviewSessions = [...this.originalInterviewSessions];

      // 濾
      // .職濾
      let filteredByPosition = this.interviewSessions;
      if (this.selectedPosition && this.selectedPosition !== 'all') {
        filteredByPosition = this.interviewSessions.filter(session => {
          const applicant = this.trackedApplicants.find(
            app => app.id === session.applicantId
          );
          if (!applicant) return false;
          const jobTitleValue = applicant.jobTitle.toLowerCase().replace(/\s+/g, '_');
          return jobTitleValue === this.selectedPosition;
        });
      }

      // .管濾
      if (this.selectedFilter === 'supervisor' && this.currentSupervisor) {
        // 示當管ID次
        filteredByPosition = filteredByPosition.filter(session =>
          session.interviewerIds.includes(this.currentSupervisor.id)
        );
      }

      // 濾次
      this.interviewSessions = filteredByPosition;
      console.log('濾次', this.interviewSessions);
    }

    // name  interview.candidate
    onSelectResume(name: string) {
      this.selectedCandidateName = name;
      this.selectedResume = this.interviews.find(i => i.candidate === name);
      this.showResumeModal = true;
    }

    onCloseResumeModal(): void {
      this.showResumeModal = false;
      this.selectedResume = null;
    }
}


