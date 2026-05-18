import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment';
import { Applicant } from '../models/applicant.model';

@Injectable({
  providedIn: 'root'
})
export class ApplicantService {
  // ä½¿ç¨ç’°å¢ƒè®æ•éç½® API URL¼å°æ‡‰å¾ç«ç„ applicants ç«é»
  private apiUrl = environment.apiUrl; // ä½¿ç¨ /api¼nginx æƒå°‡ /api/applicants è·ç±åˆ° applicant-service

  constructor(private http: HttpClient) {}

  // åå¾— token ç„ç§æ‰æ¹æ³•
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('gcp_id_token');
    if (!token) {
      throw new Error('æªæ‰¾åˆ°èªè‰ token¼è«é‡æ°ç»å');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  //  ç²ååå§æ‡‰è˜è€è³‡æ¼ˆæªç¶ç©éç„å±æ·ç³è«¼‰
  getApplicants(): Observable<Applicant[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Applicant[]>(`${this.apiUrl}/applicants`, { headers });
  }

  //  æ¹æè·ä½IDç²åæ‡‰è˜è€è³‡æ
  getApplicantsByJob(jobId: string): Observable<Applicant[]> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/applicants`;

    return this.http.get<Applicant[]>(url, {
      headers,
      params: { jobId }
    });
  }

  //  æ¹ææ‡‰è˜è€IDç²åç‰¹å®æ‡‰è˜è€è³‡æ
  getApplicantById(applicantId: string): Observable<Applicant> {
    const headers = this.getAuthHeaders();
    return this.http.get<Applicant>(`${this.apiUrl}/applicants/${applicantId}`, { headers });
  }

  //  æ¹æIDç²åæ‡‰è˜è€å§å
  getApplicantNameById(applicantId: string): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http.get<Applicant>(`${this.apiUrl}/applicants/${applicantId}`, { headers }).pipe(
      map(applicant => applicant ? applicant.name : 'æªçæ‡‰è˜è€')
    );
  }

  //  å»ºç«æ°ç„æ‡‰è˜è€è¨˜é„¼ˆå±æ·æ•é¼‰
  createApplicant(applicant: Omit<Applicant, 'id'>): Observable<Applicant> {
    const headers = this.getAuthHeaders();
    return this.http.post<Applicant>(`${this.apiUrl}/applicants`, applicant, { headers });
  }

  //  æ´æ°æ‡‰è˜è€è³‡æ¼ˆä¾å‚¼HR åˆæç©éæ¨è¨˜¼‰
  updateApplicant(applicantId: string, updates: Partial<Applicant>): Observable<Applicant> {
    const headers = this.getAuthHeaders();
    return this.http.put<Applicant>(`${this.apiUrl}/applicants/${applicantId}`, updates, { headers });
  }
  //  HR æ¨è¨˜æ‡‰è˜è€ç‚ºå·²ç©é¼ˆåéåèƒ½¼‰
  markAsScreened(applicantId: string, notes?: string): Observable<Applicant> {
    const updates: Partial<Applicant> = {
      // å‚æé€èåä»å¨é€è£¡æ·»å HR ç©éçé—æ¬„ä½
      // ä½†åºæ¬ç„ Applicant ä»é¢ä¿æç°¡å®
    };
    return this.updateApplicant(applicantId, updates);
  }

  //  ç²åæªç©éç„æ‡‰è˜è€è³‡æ
  getUnscreenedApplicants(): Observable<Applicant[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Applicant[]>(`${this.apiUrl}/applicants`, {
      headers,
      params: { hrScreened: 'false' }
    });
  }

  //  ç²åå·²ç©éç„æ‡‰è˜è€è³‡æ
  getScreenedApplicants(): Observable<Applicant[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Applicant[]>(`${this.apiUrl}/applicants`, {
      headers,
      params: { hrScreened: 'true' }
    });
  }

}
