import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment';
import { Job } from '../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.apiUrl}/jobs`);
  }

  getOpenJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.apiUrl}/jobs`).pipe(
      map(jobs => jobs
        .map(job => ({ ...job, jobStatus: job.jobStatus ?? (job as any).status }))
        .filter(job => job.jobStatus === '招募中')
      )
    );
  }

  createJob(jobTitle: string): Observable<Job> {
    const newJob: Job = {
      jobTitle,
      department: '未指定',
      createdDate: new Date(),
      jobStatus: '招募中',
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
    return this.http.post<Job>(`${this.apiUrl}/jobs`, newJob);
  }

  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/jobs/${id}`);
  }

  updateJobStatus(id: number | string, status: Job['jobStatus']): Observable<Job> {
    return this.http.patch<Job>(`${this.apiUrl}/jobs/${id}`, { status, jobStatus: status });
  }
}
