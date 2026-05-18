import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // 
import { ReviewerHeaderComponent } from '../../components/reviewer-header/reviewer-header.component';
import { NavbarComponent } from '../../components/navbar/navbar.component'; //  NavbarComponent

// PrimeNG 件
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { MessageService } from 'primeng/api'; // 
import { ToastModule } from 'primeng/toast'; // module引
import { DividerModule } from 'primeng/divider'; // 分

// import { Service, Interface }
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job.model';
import { TrackedApplicantService } from '../../services/tracked-applicant.service';
import { InterviewService } from '../../services/interview.service';
import { SupervisorComment } from '../../models/interview.model';
import { forkJoin } from 'rxjs';

interface Candidate {
  id: number;  // 為 number 刼應 Java  Long
  name: string;
  education: string;
  experience: number;
  previousCompany: string;
  skills: string;
  scoreStatus: 'completed' | 'pending';
  averageScore: number | null;
  note: string;
  source: string;
  department: string;
  totalExp: number;
  relatedExp: number;
  position: string;
  positionValue: string;
  resume: {
    workExperience: string[];
    projects: string[];
    intro: string;
  };
  scores?: { //  值遼為人能還沒被評分
    [interviewer: string]: {
      communication: number;
      skill: number;
      attitude: number;
    }| undefined;  // 許 undefined
  };
  comments?: {
    [interviewer: string]: string;
  };
}

interface Position {
  label: string;
  value: string;
}

@Component({
  selector: 'app-supervisor-decision',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    RouterModule,
    ReviewerHeaderComponent,
    NavbarComponent,
    ButtonModule,
    TableModule,
    BadgeModule,
    SelectModule,
    DialogModule,
    TagModule,
    RatingModule,
    ToastModule,
    DividerModule
    ],
  templateUrl: './supervisor-decision.component.html',
  styleUrl: './supervisor-decision.component.css',
  providers: [MessageService] // 忘了
})

export class SupervisorDecisionComponent {
  loading = true; // 載資
  filterStatus: 'all' | 'pending' | 'completed' = 'all'; // 
  selectedPosition: string = 'all'; // 職
  // interviewers: string[] = []; // 空列
  interviewSessions: any[] = []; // 從 API 到資
  interviewers: any[] = []; // 從 API 到官資
  currentSupervisor: any = {}; // 當管資
  trackedApplicants: any[] = []; // 追蹤應聘資
  allApplicants: any[] = []; // 所應聘資
  positions: Position[] = []; // 職資
  groupedInterviews: { [key: string]: any[] } = {}; // 分組屬性
  // Modal制
  scoreDialogVisible = false;
  resumeDialogVisible = false;
  currentInterviewers: string[] = []; // 官列


  // 列資
  //  裡 navbar 從部傳焼樣就使 NavbarComponent
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

  // 人資
  // candidates: Candidate[] = [
  //   {
  //     name: '',
  //     education: '灣大 資系碩士',
  //     experience: 3,
  //     previousCompany: '',
  //     skills: 'Java, Spring Boot',
  //     scoreStatus: 'pending',
  //     averageScore: null,
  //     note: '',
  //     source: 'Cake Resume',
  //     department: '部',
  //     totalExp: 3,
  //     relatedExp: 3,
  //     position: '',
  //     positionValue: 'backend',      //  
  //     resume: {
  //       workExperience: ['2019-2022 黽資深'],
  //       projects: ['部MES系統專案', '製大分平建置'],
  //       intro: '專長與系統架計跨部。',
  //     },
  //     scores: {
  //       Leo: {
  //         communication: 4,
  //         skill: 5,
  //         attitude: 5
  //       },
  //       Louis: {
  //         communication: 3,
  //         skill: 4,
  //         attitude: 4
  //       },
  //       Richard: undefined
  //     },
  //     comments: {
  //       Leo: '焼很強浼很亮人。',
  //       Louis: '還算仼表穩焼整來說滿。',
  //       Richard: '填評語'
  //     }
  //   },
  //   {
  //     name: '詹',
  //     education: '交大 資系碩士',
  //     experience: 2,
  //     previousCompany: '',
  //     skills: 'Python, React',
  //     scoreStatus: 'completed',
  //     averageScore: 4.0,
  //     note: '',
  //     source: '1111人',
  //     department: '部',
  //     totalExp: 3,
  //     relatedExp: 3,
  //     position: '',
  //     positionValue: 'frontend',      //  
  //     resume: {
  //       workExperience: ['2021-2024 秽'],
  //       projects: ['AI平', '影辨應'],
  //       intro: '長與資熼習高熱。',
  //     },
  //     scores: {
  //       Leo: { communication: 5, skill: 5, attitude: 4 },
  //       Louis: { communication: 4, skill: 4, attitude: 5 },
  //       Richard: { communication: 5, skill: 4, attitude: 5 }
  //     },
  //     comments: {
  //       Leo: 'Leo 得詹流梼能很強焼整表很出色',
  //       Louis: 'Louis 為詹表到佼尤浼整很鼁',
  //       Richard: 'Richard 得詹很嗼表很穩宼啼象彼'
  //     }
  //   },
  // ];

  //  - 職
  // positions = [
  //   { label: '部職', value: 'all' },
  //   { label: '', value: 'frontend' },
  //   { label: '', value: 'backend' },
  //   { label: '', value: 'data' },
  // ];
  // 建注 Service從 json-server  API 得職缺資
  constructor(
    private jobService: JobService,
    private trackedApplicantService: TrackedApplicantService,
    private interviewService: InterviewService,
    private messageService: MessageService //  MessageService 來示示
  ) {}

  // 載
  ngOnInit() {
    // 載管資
    this.interviewService.getInterviewers().subscribe({
      next: (interviewers) => {
        // 找到當管
        this.currentSupervisor = interviewers.find(i => i.id === '2');
        console.log('當管:', this.currentSupervisor?.name);

        // 載資
        this.loadAllData();

        // 職列表
        this.positions = this.getAvailablePositions(); // 
      },
      error: (error) => {
        console.error('載官資失敗:', error);
        this.loading = false;
      }
    });
  }
  loadAllData() {
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

        // 確資都載職列表
        this.positions = this.getAvailablePositions();
        console.log('職:', this.positions);

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
          note: session.notes || trackedApplicant?.note || feedback?.comment || '',
          totalExp: applicantData?.experience || trackedApplicant?.totalExp || 0,
          relatedExp: applicantData?.experience || trackedApplicant?.relatedExp || 0,
          resume: {
            workExperience: applicantData?.workExperience || [],
            projects: applicantData?.projects || [],
            intro: applicantData?.intro || ''
          },
          source: '104 人力銀行'
        };

        console.log(`  ${session.id}:`, result);
        return result;
      });

    console.log(`  ${processed.length} 資`);
    return processed;
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
    if (!feedbacks?.length) {
      return 0;
    }

    const scores = feedbacks
      .filter(feedback => feedback.submitted)
      .flatMap(feedback => Object.values(feedback.scores || {}))
      .filter(score => typeof score === 'number' && score > 0);

    if (scores.length === 0) {
      return 0;
    }

    const avg = (scores as number[]).reduce((sum: number, score: number) => sum + score, 0) / scores.length;
    const roundedScore = Math.round(avg);

    console.log('計算分:', {
      scores,
      average: avg,
      rounded: roundedScore
    });

    return roundedScore;
  }

  getVisibleCandidateCount(): number {
    return Object.values(this.groupedInterviews || {})
      .reduce((count: number, sessions: any) => count + (Array.isArray(sessions) ? sessions.length : 0), 0);
  }

  // 得所複職
  getAvailablePositions(): Position[] {
    console.log('得職');
    console.log('當 trackedApplicants:', this.trackedApplicants);
    console.log('當 interviewSessions:', this.interviewSessions);

    // "部職"
    const positions: Position[] = [
      { label: '全部職位', value: 'all' }
    ];

    // 從 interviewSessions 得所職
    const uniquePositions = new Set<string>();

    // 次
    this.interviewSessions.forEach(session => {
      if (session.position) {
        const positionValue = session.position.toLowerCase().replace(/\s+/g, '_');
        uniquePositions.add(session.position);
        console.log(`找到職: ${session.position} (${positionValue})`);
      }
    });

    // 將職
    Array.from(uniquePositions).sort().forEach(title => {
      positions.push({
        label: title,
        value: title.toLowerCase().replace(/\s+/g, '_')
      });
      console.log(`職: ${title}`);
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

  groupedCandidates: { positionValue: string; candidates: Candidate[] }[] = [];


  // 應聘
  selectedCandidate: Candidate | null = null;


  // 當職
  onFilterChange() {
    console.log('職:', this.selectedPosition);
    console.log('當資:', this.interviewSessions);

    const groupedMap = new Map<string, Candidate[]>();
    this.groupedCandidates = [];

    // 職進濾
  const filtered = this.interviewSessions.filter(session => {
    const positionMatch = this.selectedPosition === 'all' ||
                         session.position.toLowerCase() === this.selectedPosition;
    const statusMatch = this.filterStatus === 'all' ||
                       session.status === this.filterStatus;
    return positionMatch && statusMatch;
  });

  console.log('濾資:', filtered);

  // 將濾資轉為 Candidate 分組
  filtered.forEach(session => {
    const positionValue = session.position.toLowerCase().replace(/\s+/g, '_');

    if (!groupedMap.has(positionValue)) {
      groupedMap.set(positionValue, []);
    }

    // 轉為 Candidate 
    const candidate: Candidate = {
      id: parseInt(session.id),
      name: session.name,
      education: session.education,
      experience: session.experience,
      previousCompany: session.company,
      skills: session.skills,
      scoreStatus: session.status,
      averageScore: session.score,
      note: session.note || '',
      source: '104',
      department: session.department,
      totalExp: session.totalExp || 0,
      relatedExp: session.relatedExp || 0,
      position: session.position,
      positionValue: positionValue,
      resume: session.resume || {
        workExperience: [],
        projects: [],
        intro: ''
      }
    };

    groupedMap.get(positionValue)!.push(candidate);
  });

    // 將分組轉為列
    for (const [positionValue, candidates] of groupedMap.entries()) {
      this.groupedCandidates.push({
        positionValue,
        candidates
      });
    }

    console.log('分組:', this.groupedCandidates);
  }

  // 幫 positionValue 找出應 label
  getPositionLabel(positionValue: string): string {
    const found = this.positions.find(p => p.value === positionValue);
    return found ? found.label : positionValue;
  }


  // 得人
  // get filteredCandidates() {
  //   if (this.selectedPosition === 'all') {
  //     return this.candidates;
  //   }
  //   return this.candidates.filter(c => c.positionValue === this.selectedPosition);
  // }



  // 評分
  // openScoreDialog(candidate: Candidate) {
  openScoreDialog(session: any) {
    console.log('評分話框', session);

    // 將 session 資轉為 Candidate 
    const candidate: Candidate = {
      id: parseInt(session.id) || 0,  // 確轉為
      name: session.name,
      education: session.education,
      experience: session.experience,
      previousCompany: session.company,
      skills: session.skills,
      scoreStatus: session.status,
      averageScore: session.score,
      note: session.note || '',
      source: session.source || '104 人力銀行',
      department: session.department || '',
      totalExp: session.totalExp || '',
      relatedExp: session.relatedExp || '',
      position: session.position || '',
      positionValue: '',
      resume: session.resume || {
        workExperience: [],
        projects: [],
        intro: ''
      },
      scores: {
        // 官評分
        '官A': {
          communication: 4,
          skill: 4,
          attitude: 4
        }
      },
      comments: {
        '官A': '表'
      }
    };

    // 置人
  this.selectedCandidate = candidate;

  // 置當官列表
  this.currentInterviewers = ['官A']; // 從 session.feedbacks 得

  // 話框
  this.scoreDialogVisible = true;

  console.log('人資:', this.selectedCandidate);
  console.log('當官:', this.currentInterviewers);


    // this.selectedCandidate = candidate;
    // this.scoreDialogVisible = true;
    // //  自得人幾官 ( scores  undefined空列)
    // this.currentInterviewers = candidate.scores ? Object.keys(candidate.scores) : [];
  }

  // 
  openResumeDialog(candidate: Candidate) {
    this.selectedCandidate = candidate;
    this.resumeDialogVisible = true;
  }


  // 確人
  confirmCandidate(candidate: Candidate) {
    // 裡API
    if (!this.currentSupervisor?.id) {
      this.messageService.add({
        severity: 'error',
        summary: '錯誤',
        detail: '無法取得主管資料'
      });
      return;
    }

    this.interviewService
      .approveCandidate(
        candidate.id,
        this.currentSupervisor.id,
        this.newComment || ''
      )
      .subscribe({
        next: (response) => {
          console.log('確認人選', candidate.name);
          this.messageService.add({
            severity: 'success',
            summary: '已確認',
            detail: `已確認 ${candidate.name}`
          });

          // 資
          this.loadAllData();

          // 話框
          this.closeDialogs();
        },
        error: (error) => {
          console.error('確人失敗:', error);
          this.messageService.add({
            severity: 'error',
            summary: '錯誤',
            detail: '確認人選失敗'
          });
        }
      });

      // this.messageService.add({ severity: 'success', summary: '', detail: `已確 ${candidate.name}` });
  }

  // 絕人
  rejectCandidate(candidate: Candidate) {
    if (!this.currentSupervisor?.id) {
      this.messageService.add({
        severity: 'error',
        summary: '錯誤',
        detail: '無法取得主管資料'
      });
      return;
    }

    this.interviewService
      .rejectCandidate(
        candidate.id,
        this.currentSupervisor.id,
        this.newComment || ''
      )
      .subscribe({
        next: (response) => {
          console.log('婉拒人選', candidate.name);
          this.messageService.add({
            severity: 'success',
            summary: '已婉拒',
            detail: `已婉拒 ${candidate.name}`
          });

          // 資
          this.loadAllData();

          // 話框
          this.closeDialogs();
        },
        error: (error) => {
          console.error('絕人失敗:', error);
          this.messageService.add({
            severity: 'error',
            summary: '錯誤',
            detail: '婉拒人選失敗'
          });
        }
      });

    // console.log(' 絕人遼', candidate.name);
    // this.messageService.add({ severity: 'error', summary: '已婉拒', detail: `已婉拒 ${candidate.name}` });
    // 裡API
  }

  // 人確徼便 Dialog
  confirmAndClose(candidate: Candidate) {
    this.confirmCandidate(candidate);
    this.fillCommentDialogVisible = false;
    this.commentCandidate = null;
    this.newComment = '';
  }

  // 人絕徼便 Dialog
  rejectAndClose(candidate: Candidate) {
    this.rejectCandidate(candidate);
    this.fillCommentDialogVisible = false;
    this.commentCandidate = null;
    this.newComment = '';
  }

  // Dialog
  closeDialogs() {
    this.scoreDialogVisible = false;
    this.resumeDialogVisible = false;
    this.selectedCandidate = null;
  }

  // 增制填評語 Dialog 示
  fillCommentDialogVisible = false;
  // 人
  commentCandidate: Candidate | null = null;
  // 填評語
  newComment: string = '';

  // 填評語 Dialog 便載既評語
  openFillCommentDialog(candidate: Candidate) {
    console.log('評語話框', {
      candidate,
      candidateId: candidate.id,
      supervisorId: this.currentSupervisor?.id
    });

    this.commentCandidate = candidate;

    // 管ID就嘗載既評語
    if (this.currentSupervisor?.id) {
      console.log('載評語', {
        candidateId: candidate.id.toString(),
        supervisorId: this.currentSupervisor.id
      });

      this.interviewService
        .getSupervisorComment(candidate.id.toString(), this.currentSupervisor.id)
        .subscribe({
          next: (comment) => {
            console.log('載評語', comment);
            this.newComment = comment?.comment || '';
            this.fillCommentDialogVisible = true;
          },
          error: (error) => {
            console.error('載評語失敗:', error);
            this.newComment = '';
            this.fillCommentDialogVisible = true;
          }
        });
    } else {
      console.warn('無管ID無法載評語');
      this.newComment = '';
      this.fillCommentDialogVisible = true;
    }
    // this.newComment = candidate.note || ''; // 評語就載
    // this.fillCommentDialogVisible = true;
  }

  // 儲評語
  saveComment() {
    if (!this.commentCandidate || !this.currentSupervisor) {
      console.warn('無法儲評語缺人管資');
      return;
    }

    const comment: SupervisorComment = {
      candidateId: this.commentCandidate.id, // 確 Candidate  id 屬性
      supervisorId: this.currentSupervisor.id,
      decision: 'approve', //  decision 屬性
      comment: this.newComment,
      timestamp: new Date().toISOString()
    };

    this.interviewService.saveSupervisorComment(comment).subscribe({
      next: (response) => {
        console.log('評語儲:', response);
        this.messageService.add({
          severity: 'success',
          summary: '',
          detail: '評語已儲存'
        });

        // 資
        if (this.commentCandidate) {
          this.commentCandidate.note = this.newComment;
        }

        // 話框
        this.fillCommentDialogVisible = false;
        this.commentCandidate = null;
        this.newComment = '';
      },
      error: (error) => {
        console.error('評語儲失敗:', error);
        this.messageService.add({
          severity: 'error',
          summary: '錯誤',
          detail: '評語儲存失敗'
        });
      }
    });
  }

  updateScore(candidate: Candidate, interviewer: string, field: 'communication' | 'skill' | 'attitude', value: number) {
    if (!candidate.scores) {
    candidate.scores = {};  // 沒 scores 就
    }
    if (!candidate.scores[interviewer]) {
      candidate.scores[interviewer] = { communication: 0, skill: 0, attitude: 0 };  // 沒官就
    }
    (candidate.scores[interviewer] as any)[field] = value;
  }

  // 自計算人平分
  calculateAverageScore(candidate: Candidate): number {
    if (!candidate.scores) {
      return 0;
    }

    let totalScore = 0;
    let count = 0;

    for (const interviewer of Object.keys(candidate.scores)) {
      const score = candidate.scores[interviewer];
      if (score) {
        const average = (score.communication + score.skill + score.attitude) / 3;
        totalScore += average;
        count++;
      }
    }

    return count > 0 ? +(totalScore / count).toFixed(1) : 0; // 1
  }

}
