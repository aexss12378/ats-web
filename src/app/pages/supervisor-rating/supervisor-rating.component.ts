import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // 
import { ReviewerHeaderComponent } from '../../components/reviewer-header/reviewer-header.component';
import { NavbarComponent } from '../../components/navbar/navbar.component'; //  NavbarComponent

// PrimeNG 件
import { ButtonModule } from 'primeng/button'; // 鈕
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { SelectButtonModule } from 'primeng/selectbutton' // 切鈕;
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating'; // 評分
import { DialogModule } from 'primeng/dialog'; // 彈出窗
import { TextareaModule } from 'primeng/textarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DividerModule } from 'primeng/divider'; // 分
import { ProgressSpinnerModule } from 'primeng/progressspinner'; // 載畫

// import { Service, Interface }
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job.model';
import { TrackedApplicantService } from '../../services/tracked-applicant.service';
import { InterviewService } from '../../services/interview.service';
import { forkJoin } from 'rxjs';

// 義職資
interface Position {
  label: string;
  value: string;
}

interface SelectedCandidate {
  id: string;
  name: string;
  department: string;
  position: string;
  totalExp: number;
  relatedExp: number;
  source: string;
  integrity: 'yes' | 'no';
  integrityNote: string;
  recommendation: number | null;
  comment: string;
  [key: string]: any; // 評分欄
}

@Component({
  selector: 'app-supervisor-rating',
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
    SelectButtonModule,
    ChipModule,
    TagModule,
    RatingModule,
    DialogModule,
    TextareaModule,
    RadioButtonModule,
    DividerModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './supervisor-rating.component.html',
  styleUrl: './supervisor-rating.component.css'
})

export class SupervisorRatingComponent {
  loading = true; // 載資
  filterStatus: 'all' | 'pending' | 'completed' = 'all';
  interviewSessions: any[] = []; // 從 API 到資漈 InterviewSession 刼
  interviewers: any[] = []; // 從 API 到官資漈 Interviewer 
  currentSupervisor: any = {}; // 當管資
  trackedApplicants: any[] = []; // 追蹤應聘資
  allApplicants: any[] = []; // 所應聘資
  positions: Position[] = []; // 職資
  displayResume = false;
  selectedCandidate: SelectedCandidate | null = null;
  visible: boolean = false;
  groupedInterviews: { [key: string]: any[] } = {}; // 分組屬性

  navbar = [
    { label: '應聘者篩選', path: '/supervisor-screen-applicant', icon: 'pi pi-filter' },
    { label: '面試場次', path: '/supervisor-interview', icon: 'pi pi-calendar' },
    { label: '面試評分表', path: '/supervisor-rating', icon: 'pi pi-star' },
    { label: '人選評估', path: '/supervisor-decision', icon: 'pi pi-chart-bar' },
    { label: '人才庫', path: '/talent-pool', icon: 'pi pi-users' }
  ];

  scoreFields = [
    { key: 'expertise', label: 'Functional Expertise' },
    { key: 'initiative', label: 'Initiative' },
    { key: 'teamwork', label: 'Teamwork' },
    { key: 'development', label: 'Self-Development' },
    { key: 'adaptability', label: 'Adaptability' },
    { key: 'solving', label: 'Problem Solving' },
    { key: 'communication', label: 'Communication' }
  ];

  //  class 增表欄義
  columns = [
    { field: 'name', header: '應聘', width: '10%' },
    { field: 'education', header: '', width: '15%' },
    { field: 'experience', header: '年資', width: '8%' },
    { field: 'company', header: '', width: '12%' },
    { field: 'skills', header: '能', width: '15%' },
    { field: 'status', header: '', width: '10%' },
    { field: 'score', header: '評分', width: '10%' },
    { field: 'note', header: '註', width: '10%' },
    { field: 'actions', header: '能', width: '10%' }
  ];

  // 資
  // applicants = [
  //   {
  //     position: '',
  //     candidates: [
  //       {
  //         name: '',
  //         date: '2025/03/01',
  //         time: '10:00',
  //         room: '室A',
  //         education: '灣大<br>資管系碩士',
  //         experience: 3,
  //         company: '',
  //         skills: 'Java',
  //         status: 'completed',
  //         score: 4,
  //         note: '',
  //         source: 'iMatch',
  //         department: '部',
  //         position: '',
  //         totalExp: 6,
  //         relatedExp: 4,
  //         isSenior: 'Y',
  //         recommendation: undefined,
  //         integrity: undefined,
  //         integrityNote: '',
  //         comment: '',
  //         avgScore: 0,
  //         // 為了起分欄
  //         expertise: undefined,
  //         initiative: undefined,
  //         teamwork: undefined,
  //         development: undefined,
  //         adaptability: undefined,
  //         solving: undefined,
  //         communication: undefined
  //       },
  //       {
  //         name: '林',
  //         date: '2025/03/01',
  //         time: '11:00',
  //         room: '室A',
  //         education: '大<br>資系碩士',
  //         experience: 2,
  //         company: '',
  //         skills: 'Python, React',
  //         status: 'pending',
  //         note: '',
  //         source: '104',
  //         department: '部',
  //         position: '',
  //         totalExp: 3,
  //         relatedExp: 2,
  //         isSenior: 'N',
  //         recommendation: undefined,
  //         integrity: undefined,
  //         integrityNote: '',
  //         comment: '',
  //         avgScore: 0,
  //         // 為了起分欄
  //         expertise: undefined,
  //         initiative: undefined,
  //         teamwork: undefined,
  //         development: undefined,
  //         adaptability: undefined,
  //         solving: undefined,
  //         communication: undefined
  //       }
  //     ]
  //   },
  //   {
  //     position: '',
  //     candidates: [
  //       {
  //         name: '',
  //         date: '2025/03/02',
  //         time: '14:00',
  //         room: '室B',
  //         education: '治大<br>企管系士',
  //         experience: 2,
  //         company: '山',
  //         skills: 'Javascript, MongoDB',
  //         status: 'pending',
  //         note: '',
  //         source: 'CakeResume',
  //         department: '部',
  //         position: '',
  //         totalExp: 4,
  //         relatedExp: 2,
  //         isSenior: 'N',
  //         recommendation: undefined,
  //         integrity: undefined,
  //         integrityNote: '',
  //         comment: '',
  //         avgScore: 0,
  //         // 為了起分欄
  //         expertise: undefined,
  //         initiative: undefined,
  //         teamwork: undefined,
  //         development: undefined,
  //         adaptability: undefined,
  //         solving: undefined,
  //         communication: undefined
  //       }
  //     ]
  //   }
  // ];

  // 建注 Service從 json-server  API 得職缺資
  constructor(
    private jobService: JobService,
    private trackedApplicantService: TrackedApplicantService,
    private interviewService: InterviewService,
  ) {}

  // 載
  ngOnInit() {
    this.loading = true;

    // 載管資
    this.interviewService.getInterviewers().subscribe({
      next: (interviewers) => {
        // 找到當管
        this.currentSupervisor = interviewers.find(i => i.id === '2');
        console.log('當管:', this.currentSupervisor?.name);

        // 載資
        this.loadAllData();
      },
      error: (error) => {
        console.error('載官資失敗:', error);
        this.loading = false;
      }
    });

    // // 使 forkJoin 得所資
    // forkJoin({
    //   sessions: this.interviewService.getInterviewSessions(),
    //   // 置當管 ID 2 張
    //   interviewer: this.interviewService.getInterviewerNameById('2'),
    //   jobs: this.jobService.getJobs(),
    //   trackedApplicants: this.applicantService.getTrackedApplicants(),
    // }).subscribe({
    //   next: (data) => {
    //     // 確 currentSupervisor 值
    //     this.currentSupervisor = data.interviewer || {};
    //     this.interviewSessions = this.processInterviewData(data.sessions);
    //     this.allApplicants = data.jobs || [];
    //     this.trackedApplicants = data.trackedApplicants || [];
    //     this.loading = false;

    //     if (!this.currentSupervisor) {
    //       console.error('找到管資');
    //       return;
    //     }

    //     console.log('當管:', this.currentSupervisor);

    //     // 置資
    //     this.allApplicants = data.jobs;
    //     this.trackedApplicants = data.trackedApplicants;
    //     this.processInterviewData(data.sessions);
    //     this.loading = false; // 置 loading 為 false

    //     console.log('載資:', {
    //       interviews: this.interviewSessions,
    //       applicants: this.allApplicants,
    //       tracked: this.trackedApplicants
    //     });
    //   },
    //   error: (err) => {
    //     console.error('載資失敗:', err);
    //     this.loading = false;
    //     // 空資
    //     this.currentSupervisor = {};
    //     this.interviewSessions = [];
    //     this.allApplicants = [];
    //     this.trackedApplicants = [];
    //   }
    // });

    // // 載官資
    // this.loadInterviewers();


    // 資畫
    // // 載資
    // this.interviewSessions = this.processTestData();
    // // 置當管資証稼
    // this.currentSupervisor = {
    //   name: '張',
    //   department: '資部'
    // };
    // console.log('資', {
    //   sessions: this.interviewSessions,
    //   supervisor: this.currentSupervisor
    // });
    // this.loading = false;
  }

  private loadAllData() {
    // 使 forkJoin 載所資
    forkJoin({
      sessions: this.interviewService.getInterviewSessions(),
      jobs: this.jobService.getJobs(),
      tracked: this.trackedApplicantService.getTrackedApplicants()
    }).subscribe({
      next: (data) => {
        this.allApplicants = data.jobs || [];
        this.trackedApplicants = data.tracked || [];
        // 資
        this.interviewSessions = this.processInterviewData(data.sessions);
        // 載分組
        this.groupedInterviews = this.groupInterviewsByJobTitle();
        this.loading = false;
        console.log('資:', {
          sessions: this.interviewSessions.length,
          jobs: this.allApplicants.length,
          tracked: this.trackedApplicants.length
        });
      },
      error: (error) => {
        console.error('載資失敗:', error);
        this.loading = false;
      }
    });
  }


  // loadInterviewers(): void {
  //   this.interviewService.getInterviewers().subscribe(data => {
  //     console.log(' 官資', data);
  //     this.interviewers = data;

  //     // 出張為當官
  //     const supervisor = this.interviewers.find(interviewer => interviewer.id === '2');
  //     if (supervisor) {
  //       this.currentSupervisor = supervisor;
  //     }
  //   });
  // }

  get scoreFieldRows() {
    return [
      ...this.scoreFields,
      { key: 'integrity', label: 'Integrity Concern' },
      { key: 'recommendation', label: 'Recommendation' }
    ];
  }

  // 資使管資
  processInterviewData(sessions: any[]): any[] {
    if (!sessions?.length || !this.currentSupervisor?.id) {
      console.log(' 無資管 ID');
      return [];
    }

    console.log(`  ${sessions.length} 資`);

    const processed = sessions
      .filter(session => {
        const isInterviewer = session.interviewerIds?.includes(this.currentSupervisor.id);
        console.log(`  ${session.id}: ${isInterviewer ? '' : ''}管`);
        return isInterviewer;
      })
      .map(session => {
        // 1. 找到 trackedApplicant
        const trackedApplicant = this.trackedApplicants.find(
          ta => ta.id === session.applicantId
        );

        // 2. 從 jobs 找到應職缺應聘資
        interface Applicant {
          name: string;
          [key: string]: any;
        }

        const jobWithApplicant = this.allApplicants.find(job =>
          job.applicants?.some((app: Applicant) => app.name === trackedApplicant?.applicantName)
        );

        // 3. 找到應聘資
        const applicantData = jobWithApplicant?.applicants?.find(
          (app: Applicant) => app.name === trackedApplicant?.applicantName
        );

        const feedback = session.feedbacks?.find(
          (f: any) => f.interviewerId === this.currentSupervisor.id
        );

        console.log('找到應聘資:', {
          trackedApplicant,
          jobWithApplicant,
          applicantData
        });

        const result = {
          id: session.id,
          name: trackedApplicant?.applicantName || '應聘',
          education: applicantData?.education || '',
          experience: applicantData?.experience || 0,
          company: trackedApplicant?.previousCompany || '',
          skills: applicantData?.skills?.join(', ') || '',
          status: session.feedbacks?.some((f: any) => f.interviewerId === this.currentSupervisor.id) ? 'completed' : 'pending',
          score: this.calculateScore(session.feedbacks),
          department: trackedApplicant?.department || '',
          position: trackedApplicant?.jobTitle || trackedApplicant?.jobTitle || '分類',
          note: '',
          totalExp: trackedApplicant?.totalExp || 0,
          relatedExp: trackedApplicant?.relatedExp || 0
        };

        console.log(`  ${session.id}:`, result);
        return result;
      });

    console.log(`  ${processed.length} 資`);
    return processed;

    // return sessions.map(session => ({
    //   ...session,
    //   name: session.name || '',
    //   education: session.education || '',
    //   experience: session.experience || 0,
    //   company: session.company || '',
    //   skills: session.skills || '',
    //   score: session.score || 0,
    //   note: session.note || '',
    //   status: session.status || 'pending'
    // }));

  }

  // 得法
  getInterviewStatus(session: any): 'completed' | 'pending' {
    if (!session.feedbacks) return 'pending';
    return session.feedbacks.some((f: any) =>
      f.interviewerId === this.currentSupervisor.id && f.submitted
    ) ? 'completed' : 'pending';
  }

  findApplicantData(applicantId: string): any {
    for (const job of this.allApplicants) {
      if (job.applicants) {
        const applicant = job.applicants.find((a: any) => a.id === applicantId || a.name === applicantId);
        if (applicant) return applicant;
      }
    }
    return null;
  }

  calculateScore(feedbacks: any[]): number {
    if (!feedbacks?.length || !this.currentSupervisor) {
      return 0;
    }

    // 找到當管
    const feedback = feedbacks.find(f =>
      f.interviewerId === this.currentSupervisor.id
    );

    if (!feedback?.submitted) {
      return 0;
    }

    // 計算平分
    const scores = Object.values(feedback.scores || {})
      .filter(score => typeof score === 'number' && score > 0);

    if (scores.length === 0) {
      return 0;
    }

    const avg = (scores as number[]).reduce((sum: number, score: number) => sum + score, 0) / scores.length;
    const roundedScore = Math.round(avg);

    console.log('計算分:', {
      feedbackId: feedback.id,
      scores,
      average: avg,
      rounded: roundedScore
    });

    return roundedScore;
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
    if (!this.interviewSessions?.length) {
      console.log('無資分組');
      return {};
    }

    // 濾件資
    const filteredSessions = this.interviewSessions.filter(session => {
      const matchesFilter = this.filterStatus === 'all' ||
                          session.status === this.filterStatus;
      console.log(` 濾 ${session.id}: ${matchesFilter ? '' : ''}`);
      return matchesFilter;
    });

    // 職分組
    const grouped = filteredSessions.reduce((acc, session) => {
      const position = session.position || '分類';

      if (!acc[position]) {
        acc[position] = [];
      }

      acc[position].push(session);
      console.log(` 將 ${session.id}  ${position} 群組`);
      return acc;
    }, {});

    console.log(' 分組:', grouped);
    return grouped;
  }

  // 得評分次
  getPendingCount(): number {
    return this.interviewSessions?.filter(session =>
      // 計算當管評分次
      session.status === 'pending'
    ).length;
  }

  onSelectResume(candidate: any) {
    this.selectedCandidate = candidate;
    this.displayResume = true;
  }

  onCloseResume() {
    this.displayResume = false;
    this.selectedCandidate = null;
  }

  // 切評分/已評分/部評分鈕
  onFilterChange(status: 'all' | 'pending' | 'completed') {
    this.filterStatus = status;
    // 分組
    this.groupedInterviews = this.groupInterviewsByJobTitle();
  }

  getFilteredCandidates(section: any) {
    if (this.filterStatus === 'all') return section.candidates;
    return section.candidates.filter((c: any) => c.status === this.filterStatus);
  }

  // 評分表
  showDialog(session: any) {
    if (!session || !this.currentSupervisor) {
      console.error('次資管載');
      return;
    }

    console.log('到次資:', session);

    const candidateId = parseInt(session.id, 10);
    const interviewerId = this.currentSupervisor.id;

    // 建表資漈空值
    this.selectedCandidate = {
      id: session.id,
      name: session.name,
      department: session.department || '',
      position: session.position || '',
      totalExp: session.experience || 0,
      relatedExp: session.relatedExp || 0,
      source: '104人',
      expertise: 0,
      initiative: 0,
      teamwork: 0,
      development: 0,
      adaptability: 0,
      solving: 0,
      communication: 0,
      integrity: 'no',
      integrityNote: '',
      recommendation: null,
      comment: ''
    };

    // 示話框資載示
    this.visible = true;

    //  API 詢已評分紀
    this.interviewService.getScore(candidateId, interviewerId).subscribe({
      next: (feedback) => {
        console.log(' 已得評分:', feedback);
        this.selectedCandidate = {
          ...this.selectedCandidate!,
          ...feedback.scores,
          integrity: (feedback.integrity === 'yes' || feedback.integrity === 'no') ? feedback.integrity : 'no',
          integrityNote: feedback.integrityNote,
          recommendation: feedback.recommendation,
          comment: feedback.comment
        };
      },
      error: () => {
        console.log(' 無評分記鄼為評分');
      }
    });


    // // 找到評分記鄼則創建
    // let feedback = session.feedbacks.find(
    //   (f: any) => f.interviewerId === this.currentSupervisor?.id
    // );

    // // 1. 確整資
    // const interviewSession = this.interviewSessions.find(s => s.id === session.id);
    // if (!interviewSession) {
    //   console.error('找到應次');
    //   return;
    // }

    // // 2. 找到應徵資
    // const trackedApplicant = this.trackedApplicants.find( ta =>
    //   ta.id === interviewSession.applicantId ||
    //   ta.applicantName === session.name
    // );

    // console.log('找到 trackedApplicant:', trackedApplicant);

    // // 3. 找到職缺資
    // interface Applicant {
    //   name: string;
    //   [key: string]: any;
    // }

    // const jobWithApplicant = this.allApplicants.find(job =>
    //   job.jobTitle === session.position &&
    //   job.applicants?.some((app: Applicant) => app.name === session.name)
    // );

    // console.log('找到 jobWithApplicant:', jobWithApplicant);

    // // 4. 找到應聘詳細資
    // const applicantData = jobWithApplicant?.applicants?.find(
    //   (app: Applicant) => app.name === session.name
    // );

    // console.log('找到 applicantData:', applicantData);


    // // 6. 組所資
    // this.selectedCandidate = {
    //   id: session.id,
    //   name: session.name,
    //   department: session.department || jobWithApplicant?.department || '',
    //   position: session.position || trackedApplicant?.jobTitle || '',
    //   totalExp: applicantData?.experience || session.experience || 0,
    //   relatedExp: trackedApplicant?.relatedExp || 0,
    //   source: jobWithApplicant?.source || '104人',

    //   // 評分欄
    //   ...this.scoreFields.reduce((acc, field) => ({
    //     ...acc,
    //     [field.key]: feedback?.scores?.[field.key] || 0
    //   }), {}),

    //   // 評分欄
    //   integrity: feedback?.integrity || 'no',
    //   integrityNote: feedback?.integrityNote || '',
    //   recommendation: feedback?.recommendation || null,
    //   comment: feedback?.comment || '',
    // };

    // console.log('示評分資:', {
    //   評分表: this.selectedCandidate,
    //   資: session
    // });

    // this.visible = true;

    // // 增記點
    // if (!feedback) {
    //   console.log('注愼找到評分記鄼能評分資誤');
    // }
  }

  // 交評分
  submit() {
    if (!this.selectedCandidate || !this.currentSupervisor) {
      console.error('無法儲嘼缺人管資');
      return;
    }

    const dto = {
      candidateId: parseInt(this.selectedCandidate.id, 10),
      interviewerId: this.currentSupervisor.id,
      scores: {
        expertise: this.selectedCandidate['expertise'],
        initiative: this.selectedCandidate['initiative'],
        teamwork: this.selectedCandidate['teamwork'],
        development: this.selectedCandidate['development'],
        adaptability: this.selectedCandidate['adaptability'],
        solving: this.selectedCandidate['solving'],
        communication: this.selectedCandidate['communication']
      },
      integrity: this.selectedCandidate.integrity,
      integrityNote: this.selectedCandidate.integrityNote,
      recommendation: this.selectedCandidate.recommendation || 0,
      comment: this.selectedCandidate.comment
    };

    console.log('送出 dto:', dto);

    this.interviewService.saveScore(dto).subscribe({
      next: () => {
        alert('評分已儲存');
        this.visible = false;
      },
      error: (err) => {
        console.error('儲存失敗', err);
        alert('儲存失敗');
      }
    });
  }

}


