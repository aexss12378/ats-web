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
  selector: 'app-interviewer-rating',
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
  templateUrl: './interviewer-rating.component.html',
  styleUrl: './interviewer-rating.component.css'
})

export class InterviewerRatingComponent {
  loading = true; // 載資
  filterStatus: 'all' | 'pending' | 'completed' = 'all';
  interviewSessions: any[] = []; // 從 API 到資漈 InterviewSession 刼
  rawInterviewSessions: any[] = [];
  interviewers: any[] = []; // 從 API 到官資漈 Interviewer 
  currentSupervisor: any = {}; // 當管資
  trackedApplicants: any[] = []; // 追蹤應聘資
  allApplicants: any[] = []; // 所應聘資
  positions: Position[] = []; // 職資
  displayResume = false;
  selectedCandidate: SelectedCandidate | null = null;
  visible: boolean = false;
  groupedInterviews: { [key: string]: any[] } = {}; // 分組屬性

  // 列資
  navbar = [
    { label: '面試場次', path: '/interviewer-interview', icon: 'pi pi-calendar' },
    { label: '面試評分表', path: '/interviewer-rating', icon: 'pi pi-star' },
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
        this.currentSupervisor = interviewers.find(i => i.id === '1');
        console.log('當管:', this.currentSupervisor?.name);

        // 載資
        this.loadAllData();
      },
      error: (error) => {
        console.error('載官資失敗:', error);
        this.loading = false;
      }
    });
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
        this.rawInterviewSessions = data.sessions || [];
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
          applicantId: session.applicantId,
          feedback,
          name: trackedApplicant?.applicantName || '應聘',
          education: applicantData?.education || '',
          experience: applicantData?.experience || 0,
          company: trackedApplicant?.previousCompany || '',
          skills: applicantData?.skills?.join(', ') || '',
          status: feedback?.submitted ? 'completed' : 'pending',
          score: this.calculateScore(session.feedbacks),
          department: trackedApplicant?.department || '',
          position: trackedApplicant?.jobTitle || trackedApplicant?.jobTitle || '分類',
          note: feedback?.comment || '',
          totalExp: trackedApplicant?.totalExp || applicantData?.experience || 0,
          relatedExp: trackedApplicant?.relatedExp || applicantData?.experience || 0,
          source: trackedApplicant?.source || '104人',
          workExperience: applicantData?.workExperience || [],
          projects: applicantData?.projects || [],
          intro: applicantData?.intro || '',
          expertise: feedback?.scores?.expertise || 0,
          initiative: feedback?.scores?.initiative || 0,
          teamwork: feedback?.scores?.teamwork || 0,
          development: feedback?.scores?.development || 0,
          adaptability: feedback?.scores?.adaptability || 0,
          solving: feedback?.scores?.solving || 0,
          communication: feedback?.scores?.communication || 0,
          integrity: feedback?.integrity || 'no',
          integrityNote: feedback?.integrityNote || '',
          recommendation: feedback?.recommendation || null,
          comment: feedback?.comment || ''
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

  getPendingCount(): number {
    return this.interviewSessions?.filter(session =>
      // 計算當管評分次
      session.status === 'pending'
    ).length;

    // return this.applicants
    //   .flatMap(s => s.candidates)
    //   .filter(c => c.status === 'pending').length;
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

  // showDialog(candidate: any) {
  showDialog(session: any) {
    if (!session || !this.currentSupervisor) {
      console.error('次資管載');
      return;
    }

    console.log('到次資:', session);

    // 建表資漈空值
    this.selectedCandidate = {
      id: session.id,
      name: session.name,
      department: session.department || '',
      position: session.position || '',
      totalExp: session.experience || 0,
      relatedExp: session.relatedExp || 0,
      source: session.source || '104人',
      expertise: session.expertise || 0,
      initiative: session.initiative || 0,
      teamwork: session.teamwork || 0,
      development: session.development || 0,
      adaptability: session.adaptability || 0,
      solving: session.solving || 0,
      communication: session.communication || 0,
      integrity: session.integrity || 'no',
      integrityNote: session.integrityNote || '',
      recommendation: session.recommendation || null,
      comment: session.comment || '',
      feedback: session.feedback,
      applicantId: session.applicantId,
      workExperience: session.workExperience || [],
      projects: session.projects || [],
      intro: session.intro || ''
    };

    // 示話框資載示
    this.visible = true;
    // console.log('評分表', candidate); //  確沒
    // this.selectedCandidate = {
    //   ...candidate,
    //   integrityNote: candidate.integrityNote ?? '',
    //   comment: candidate.comment ?? '',
    //   recommendation: candidate.recommendation ?? undefined,
    //   integrity: candidate.integrity ?? undefined,
    //   avgScore: candidate.avgScore ?? 0
    // };
    // this.visible = true;
  }

  // saveScore() {
  //   if (this.selectedCandidate) {
  //     const total = this.scoreFields.reduce((acc, field) => acc + (this.selectedCandidate[field.key] || 0), 0);
  //     this.selectedCandidate.avgScore = Number((total / this.scoreFields.length).toFixed(1));
  //     this.selectedCandidate.status = 'completed';
  //     this.visible = false;
  //   }
  // }

  // 交評分
  submit() {
    if (!this.selectedCandidate || !this.currentSupervisor) {
      console.error('無法儲存，缺少候選人或主管資料');
      return;
    }

    const rawSession = this.rawInterviewSessions.find(session =>
      String(session.id) === String(this.selectedCandidate!.id)
    );

    if (!rawSession?.id) {
      console.error('找不到面試場次');
      alert('儲存失敗');
      return;
    }

    const updatedFeedback = {
      ...(this.selectedCandidate['feedback'] || {}),
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
      comment: this.selectedCandidate.comment,
      submitted: true,
      submittedTime: new Date().toISOString(),
      waitDays: 0
    };

    const feedbacks = [...(rawSession.feedbacks || [])];
    const feedbackIndex = feedbacks.findIndex((feedback: any) =>
      String(feedback.interviewerId) === String(this.currentSupervisor.id)
    );

    if (feedbackIndex >= 0) {
      feedbacks[feedbackIndex] = updatedFeedback;
    } else {
      feedbacks.push(updatedFeedback);
    }

    const patch = {
      feedbacks,
      allFeedbacksReceived: feedbacks.every((feedback: any) => feedback.submitted)
    };

    console.log('送出評分', patch);

    this.interviewService.updateInterviewSession(rawSession.id, patch).subscribe({
      next: () => {
        alert('評分已儲存');
        this.visible = false;
        this.loadAllData();
      },
      error: (err) => {
        console.error('儲存失敗', err);
        alert('儲存失敗');
      }
    });
  }

}
