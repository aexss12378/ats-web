import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment';
import { Job } from '../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  // 使用微服務專用的 API URL
  private apiUrl = environment.apiUrl; // 使用 /api，nginx 會將 /api/jobs 路由到 job-service

  constructor(private http: HttpClient) { }

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

  // 取得所有職缺資料
  getJobs(): Observable<Job[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Job[]>(`${this.apiUrl}/jobs`, { headers });
  }
  // 只取得開啟中的職缺
  getOpenJobs(): Observable<Job[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Job[]>(`${this.apiUrl}/jobs`, { headers }).pipe(
      map(jobs => jobs
        .map(job => ({
          ...job,
          jobStatus: job.jobStatus ?? (job as any).status
        }))
        .filter(job => job.jobStatus === '招募中')
      )
    );
  }

  // 創建新職缺
  createJob(jobTitle: string): Observable<Job> {
    const headers = this.getAuthHeaders();    const newJob: Job = {
      jobTitle,
      department: '未指定', // 預設值
      createdDate: new Date(),
      jobStatus: '招募中', // 建議用你的型別定義 '招募中'
      applicantCount: 0,
      applicants: [],
      manager: '尚未指定',
      managerNotReplied: 0,
      managerReplied: 0,
      firstInterview: 0,
      jointInterview: 0,
      selectionMeeting: 0,
      hiredCount: 0,
      candidateAppointment: 0,
      onBoarding: 0
    };
    return this.http.post<Job>(`${this.apiUrl}/jobs`, newJob, { headers });
  }
  // 刪除職缺
  deleteJob(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/jobs/${id}`, { headers });
  }

  // 關閉職缺，保留既有履歷與流程資料
  updateJobStatus(id: number | string, status: Job['jobStatus']): Observable<Job> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Job>(`${this.apiUrl}/jobs/${id}`, {
      status,
      jobStatus: status
    }, { headers });
  }
}
