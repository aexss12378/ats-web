import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private processService: ProcessService) {}

  createTrackedApplicants(applicants: any[]): Observable<any[]> {
    return this.getTrackedApplicants().pipe(
      switchMap(existingApplicants => {
        const requests = applicants.map((applicant, index) => {
          const applicantId = applicant.applicantId ?? applicant.id ?? `${Date.now()}-${index}`;
          const applicantName = applicant.applicantName ?? applicant.name;
          const jobId = applicant.jobId ?? '';
          const jobTitle = applicant.jobTitle;
          const existing = existingApplicants.find(e =>
            (e.applicantId && String(e.applicantId) === String(applicantId))
            || (e.applicantName === applicantName && e.jobTitle === jobTitle)
          );
          if (existing) return of(existing);

          const trackedApplicant = {
            id: `${applicantId}-${Date.now()}-${index}`,
            applicantId, applicantName, jobId, jobTitle,
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
            trackedApplicant
          );
        });
        return forkJoin(requests);
      })
    );
  }

  getTrackedApplicants(): Observable<TrackedApplicant[]> {
    return this.http.get<TrackedApplicant[]>(`${this.apiUrl}/trackedApplicants`);
  }

  getTrackedApplicantById(applicantId: string): Observable<TrackedApplicant> {
    return this.http.get<TrackedApplicant>(`${this.apiUrl}/trackedApplicants/${applicantId}`);
  }

  getTrackedApplicantsByJobAndStep(jobTitle: string, currentStep: number): Observable<TrackedApplicant[]> {
    return this.http.get<TrackedApplicant[]>(`${this.apiUrl}/trackedApplicants`).pipe(
      map(applicants => applicants.filter(a =>
        a.jobTitle === jobTitle
        && Number(a.processStepId) === Number(currentStep)
        && a.stepStatus !== '拒絕'
        && (Number(currentStep) !== 4 || a.taskStatus === '已寄面試邀請')
      ))
    );
  }

  updateTrackedApplicantStatus(applicantId: string, status: string): Observable<TrackedApplicant> {
    return this.http.patch<TrackedApplicant>(`${this.apiUrl}/trackedApplicants/${applicantId}`, { status });
  }

  updateTrackedApplicantScores(applicantId: string, scores: {
    englishScore?: number; logicScore?: number; codingScore?: number;
  }): Observable<TrackedApplicant> {
    return this.http.patch<TrackedApplicant>(`${this.apiUrl}/trackedApplicants/${applicantId}`, scores);
  }

  updateTrackedApplicantProcess(applicantId: string, processUpdate: {
    processStepId: number; stepStatus: StepOutcome; taskStatus?: TaskStatus;
    initialReviewStatus?: string; status?: string; managerRespondedAt?: string;
    processUpdatedAt?: string; supervisorConfirmed?: boolean; interviewSessionId?: string;
  }): Observable<TrackedApplicant> {
    return this.http.patch<TrackedApplicant>(`${this.apiUrl}/trackedApplicants/${applicantId}`, processUpdate);
  }

  setInterviewSessionId(applicantId: string, interviewSessionId: string): Observable<TrackedApplicant> {
    return this.http.patch<TrackedApplicant>(`${this.apiUrl}/trackedApplicants/${applicantId}`, { interviewSessionId });
  }

  saveSupervisorAction(applicantId: string, action: 'invite' | 'reject', note: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/supervisor-comments`, {
      applicantId, action, note, timestamp: new Date().toISOString()
    });
  }

  getTrackedApplicantNameById(applicantId: string): Observable<string> {
    return this.http.get<TrackedApplicant[]>(`${this.apiUrl}/trackedApplicants`, { params: { id: applicantId } }).pipe(
      map(applicants => applicants?.length > 0 ? applicants[0].applicantName : '應聘者')
    );
  }

  deleteTrackedApplicant(applicantId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/trackedApplicants/${applicantId}`);
  }
}
