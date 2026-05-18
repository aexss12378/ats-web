import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment';
import {
  Interviewer,
  InterviewSession,
  InterviewScoreDTO,
  SupervisorComment
} from '../models/interview.model';

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getInterviewers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/interviewers`);
  }

  getInterviewerNameById(interviewerId: string): Observable<string> {
    return this.http.get<Interviewer>(`${this.apiUrl}/interviewers/${interviewerId}`).pipe(
      map(interviewer => interviewer ? interviewer.name : '未知面試官')
    );
  }

  createInterviewSession(session: InterviewSession): Observable<any> {
    return this.http.post(`${this.apiUrl}/interviewSessions`, session);
  }

  updateInterviewSession(sessionId: string, session: Partial<InterviewSession>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/interviewSessions/${sessionId}`, session);
  }

  getInterviewSessions(): Observable<InterviewSession[]> {
    return this.http.get<InterviewSession[]>(`${this.apiUrl}/interviewSessions`);
  }

  saveScore(dto: InterviewScoreDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/feedbacks`, dto);
  }

  getScore(candidateId: number, interviewerId: number): Observable<InterviewScoreDTO> {
    return this.http.get<InterviewScoreDTO>(`${this.apiUrl}/feedbacks`, {
      params: {
        candidateId: candidateId.toString(),
        interviewerId: interviewerId.toString()
      }
    });
  }

  saveSupervisorComment(comment: SupervisorComment): Observable<any> {
    return this.http.post(`${this.apiUrl}/supervisor-comments`, comment);
  }

  getSupervisorComment(candidateId: string, supervisorId: string): Observable<SupervisorComment> {
    const params = new HttpParams()
      .set('candidateId', candidateId)
      .set('supervisorId', supervisorId);
    return this.http.get<SupervisorComment[]>(`${this.apiUrl}/supervisor-comments`, { params }).pipe(
      map(comments => comments[0])
    );
  }

  updateSupervisorComment(comment: SupervisorComment): Observable<any> {
    return this.http.put(`${this.apiUrl}/supervisor-comments/${comment.candidateId}`, comment);
  }

  approveCandidate(candidateId: number, supervisorId: string, comment: string): Observable<any> {
    const decision: SupervisorComment = {
      candidateId, supervisorId, decision: 'approve', comment,
      timestamp: new Date().toISOString()
    };
    return this.http.post(`${this.apiUrl}/supervisor-comments`, decision);
  }

  rejectCandidate(candidateId: number, supervisorId: string, comment: string): Observable<any> {
    const decision: SupervisorComment = {
      candidateId, supervisorId, decision: 'reject', comment,
      timestamp: new Date().toISOString()
    };
    return this.http.post(`${this.apiUrl}/supervisor-comments`, decision);
  }

  getDecisionStatus(candidateId: number, supervisorId: string): Observable<SupervisorComment> {
    return this.http.get<SupervisorComment>(
      `${this.apiUrl}/supervisor-decisions/${candidateId}/${supervisorId}`
    );
  }
}
