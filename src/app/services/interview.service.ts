import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment';
import {
  Interviewer,
  InterviewSession,
  InterviewerFeedback,
  InterviewScoreDTO,
  SupervisorComment
} from '../models/interview.model';

@Injectable({
  providedIn: 'root'
})
export class InterviewService {

  constructor(private http: HttpClient) { }
  private apiUrl = environment.apiUrl; // 使用 /api，nginx 會路由到 interview-service

  // 取得 token 的私有方法
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('gcp_id_token');
    if (!token) {
      throw new Error('未找到認證 token，請重新登入');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  
  // 取得所有面試官資料
  getInterviewers(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/interviewers`, { headers });
  }

  // 傳入面試官ID，取得該面試官姓名
  getInterviewerNameById(interviewerId: string): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http.get<Interviewer>(`${this.apiUrl}/interviewers/${interviewerId}`, { headers }).pipe(
      map(interviewer => interviewer ? interviewer.name : '未知面試官')
    );
  }

  createInterviewSession(session: InterviewSession): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/interviewSessions`, session, { headers });
  }

  updateInterviewSession(sessionId: string, session: Partial<InterviewSession>): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(`${this.apiUrl}/interviewSessions/${sessionId}`, session, { headers });
  }

  // 取得所有面試會議資料
  getInterviewSessions(): Observable<InterviewSession[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<InterviewSession[]>(`${this.apiUrl}/interviewSessions`, { headers });
  }
  // 儲存面試評分表
  saveScore(dto: InterviewScoreDTO): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/feedbacks`, dto, { headers });
  }

  getScore(candidateId: number, interviewerId: number): Observable<InterviewScoreDTO> {
    const headers = this.getAuthHeaders();
    return this.http.get<InterviewScoreDTO>(`${this.apiUrl}/feedbacks`, {
      headers,
      params: {
        candidateId: candidateId.toString(),
        interviewerId: interviewerId.toString()
      }
    });
  }

  // 新增主管評語
  saveSupervisorComment(comment: SupervisorComment): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/supervisor-comments`, comment, { headers });
  }
  // 取得主管評語
  getSupervisorComment(candidateId: string, supervisorId: string): Observable<SupervisorComment> {
    console.log('呼叫 getSupervisorComment', { candidateId, supervisorId });

    const headers = this.getAuthHeaders();
    // 修改查詢參數的建立方式
    const params = new HttpParams()
      .set('candidateId', candidateId)
      .set('supervisorId', supervisorId);

    return this.http.get<SupervisorComment[]>(
      `${this.apiUrl}/supervisor-comments`,
      { headers, params }
    ).pipe(
      map(comments => {
        console.log('收到的評語資料', comments);
        return comments[0];  // 返回第一筆符合的資料
      })
    );
  }

  // 更新主管評語
  updateSupervisorComment(comment: SupervisorComment): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(
      `${this.apiUrl}/supervisor-comments/${comment.candidateId}`,
      comment,
      { headers }
    );
  }

  // 確認人選
  approveCandidate(candidateId: number, supervisorId: string, comment: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const decision: SupervisorComment = {
      candidateId,
      supervisorId,
      decision: 'approve',
      comment,
      timestamp: new Date().toISOString()
    };

    return this.http.post(`${this.apiUrl}/supervisor-comments`, decision, { headers });
  }

  // 拒絕人選
  rejectCandidate(candidateId: number, supervisorId: string, comment: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const decision: SupervisorComment = {
      candidateId,
      supervisorId,
      decision: 'reject',
      comment,
      timestamp: new Date().toISOString()
    };

    return this.http.post(`${this.apiUrl}/supervisor-comments`, decision, { headers });
  }

  // 取得主管決策狀態
  getDecisionStatus(candidateId: number, supervisorId: string): Observable<SupervisorComment> {
    return this.http.get<SupervisorComment>(
      `${this.apiUrl}/supervisor-decisions/${candidateId}/${supervisorId}`
    );
  }
}
