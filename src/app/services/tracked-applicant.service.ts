import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ProcessService } from './process.service';
import { environment } from '../../environment';
import { TrackedApplicant } from '../models/tracked-applicant.model';
import { StepOutcome, TaskStatus } from '../models/process.model';

@Injectable({
  providedIn: 'root'
})
export class TrackedApplicantService {
  // 使環境置 API URL應 trackedApplicants 點
  private apiUrl = environment.apiUrl; // 使 /apinginx 將 /api/trackedApplicants 到 tracked-applicant-service

  constructor(private http: HttpClient, private processService: ProcessService) {}

  // 得 token 私法
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('gcp_id_token');
    if (!token) {
      throw new Error('找不到 token');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // 假 applicants 列裡物件 applicantId, jobId 欄
  createTrackedApplicants(applicants: any[]): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.getTrackedApplicants().pipe(
      switchMap(existingApplicants => {
        const requests = applicants.map((applicant, index) => {
          const applicantId = applicant.applicantId ?? applicant.id ?? `${Date.now()}-${index}`;
          const applicantName = applicant.applicantName ?? applicant.name;
          const jobId = applicant.jobId ?? '';
          const jobTitle = applicant.jobTitle;
          const existing = existingApplicants.find(existingApplicant =>
            (existingApplicant.applicantId && String(existingApplicant.applicantId) === String(applicantId))
            || (existingApplicant.applicantName === applicantName && existingApplicant.jobTitle === jobTitle)
          );

          if (existing) {
            return of(existing);
          }

          const trackedApplicant = {
            id: `${applicantId}-${Date.now()}-${index}`,
            applicantId,
            applicantName,
            jobId,
            jobTitle,
            supervisor: applicant.supervisor ?? '未指派',
            sentTime: new Date().toISOString(),
            initialReviewStatus: applicant.initialReviewStatus ?? 'Pending Review',
            taskStatus: applicant.taskStatus ?? '待主管回覆',
            previousCompany: applicant.previousCompany,
            englishScore: applicant.englishScore ?? null,
            logicScore: applicant.logicScore ?? null,
            codingScore: applicant.codingScore ?? null,
            processStepId: applicant.processStepId ?? 1,
            stepStatus: applicant.stepStatus ?? '進行中',
            interviewSessionId: applicant.interviewSessionId ?? null
          };

          return this.http.post(
            `${this.apiUrl}/trackedApplicants?applicantId=${applicantId}&jobId=${jobId}`,
            trackedApplicant,
            { headers }
          );
        });
        return forkJoin(requests);
      })
    );
  }


  // 所追蹤
  getTrackedApplicants(): Observable<TrackedApplicant[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<TrackedApplicant[]>(`${this.apiUrl}/trackedApplicants`, { headers });
  }

  // ID追蹤
  getTrackedApplicantById(applicantId: string): Observable<TrackedApplicant> {
    const headers = this.getAuthHeaders();
    return this.http.get<TrackedApplicant>(`${this.apiUrl}/trackedApplicants/${applicantId}`, { headers });
  }

  // 根據職位和流程步驟獲取追蹤申請者
  getTrackedApplicantsByJobAndStep(jobTitle: string, currentStep: number): Observable<TrackedApplicant[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<TrackedApplicant[]>(`${this.apiUrl}/trackedApplicants`, { headers }).pipe(
      map(applicants => applicants.filter(applicant =>
        applicant.jobTitle === jobTitle
        && Number(applicant.processStepId) === Number(currentStep)
        && applicant.stepStatus !== '拒絕'
        && (Number(currentStep) !== 4 || applicant.taskStatus === '已寄面試邀請')
      ))
    );
  }

  // 更新追蹤申請者狀態
  updateTrackedApplicantStatus(applicantId: string, status: string): Observable<TrackedApplicant> {
    const headers = this.getAuthHeaders();
    return this.http.patch<TrackedApplicant>(`${this.apiUrl}/trackedApplicants/${applicantId}`,
      { status },
      { headers }
    );
  }

  //  追蹤驗分
  updateTrackedApplicantScores(applicantId: string, scores: {
    englishScore?: number;
    logicScore?: number;
    codingScore?: number;
  }): Observable<TrackedApplicant> {
    const headers = this.getAuthHeaders();
    return this.http.patch<TrackedApplicant>(`${this.apiUrl}/trackedApplicants/${applicantId}`,
      scores,
      { headers }
    );
  }

  //  追蹤流
  updateTrackedApplicantProcess(applicantId: string, processUpdate: {
    processStepId: number;
    stepStatus: StepOutcome;
    taskStatus?: TaskStatus;
    initialReviewStatus?: string;
    status?: string;
    managerRespondedAt?: string;
    processUpdatedAt?: string;
    supervisorConfirmed?: boolean;
    interviewSessionId?: string;
  }): Observable<TrackedApplicant> {
    const headers = this.getAuthHeaders();
    return this.http.patch<TrackedApplicant>(`${this.apiUrl}/trackedApplicants/${applicantId}`,
      processUpdate,
      { headers }
    );
  }

  //  次ID
  setInterviewSessionId(applicantId: string, interviewSessionId: string): Observable<TrackedApplicant> {
    const headers = this.getAuthHeaders();
    return this.http.patch<TrackedApplicant>(`${this.apiUrl}/trackedApplicants/${applicantId}`,
      { interviewSessionId },
      { headers }
    );
  }

  //  儲管邀約與絕記
  saveSupervisorAction(applicantId: string, action: 'invite' | 'reject', note: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = {
      applicantId,
      action,
      note,
      timestamp: new Date().toISOString()
    };
    return this.http.post(`${this.apiUrl}/supervisor-comments`, body, { headers });
  }

  //  ID
  getTrackedApplicantNameById(applicantId: string): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http.get<TrackedApplicant[]>(`${this.apiUrl}/trackedApplicants`, {
      headers,
      params: { id: applicantId }
    }).pipe(
      map(applicants => {
        if (applicants && applicants.length > 0) {
          return applicants[0].applicantName;
        }
        return '應聘者';
      })
    );
  }

  //  刪追蹤
  deleteTrackedApplicant(applicantId: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/trackedApplicants/${applicantId}`, { headers });
  }
}
