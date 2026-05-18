import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment';
import { Applicant } from '../models/applicant.model';

@Injectable({
  providedIn: 'root'
})
export class ApplicantService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getApplicants(): Observable<Applicant[]> {
    return this.http.get<Applicant[]>(`${this.apiUrl}/applicants`);
  }

  getApplicantsByJob(jobId: string): Observable<Applicant[]> {
    return this.http.get<Applicant[]>(`${this.apiUrl}/applicants`, { params: { jobId } });
  }

  getApplicantById(applicantId: string): Observable<Applicant> {
    return this.http.get<Applicant>(`${this.apiUrl}/applicants/${applicantId}`);
  }

  getApplicantNameById(applicantId: string): Observable<string> {
    return this.http.get<Applicant>(`${this.apiUrl}/applicants/${applicantId}`).pipe(
      map(applicant => applicant ? applicant.name : '未知應聘者')
    );
  }

  createApplicant(applicant: Omit<Applicant, 'id'>): Observable<Applicant> {
    return this.http.post<Applicant>(`${this.apiUrl}/applicants`, applicant);
  }

  updateApplicant(applicantId: string, updates: Partial<Applicant>): Observable<Applicant> {
    return this.http.put<Applicant>(`${this.apiUrl}/applicants/${applicantId}`, updates);
  }

  markAsScreened(applicantId: string, notes?: string): Observable<Applicant> {
    return this.updateApplicant(applicantId, {});
  }

  getUnscreenedApplicants(): Observable<Applicant[]> {
    return this.http.get<Applicant[]>(`${this.apiUrl}/applicants`, { params: { hrScreened: 'false' } });
  }

  getScreenedApplicants(): Observable<Applicant[]> {
    return this.http.get<Applicant[]>(`${this.apiUrl}/applicants`, { params: { hrScreened: 'true' } });
  }
}
