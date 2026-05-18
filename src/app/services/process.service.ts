import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environment';
import { ProcessStep, StepOutcome } from '../models/process.model';

const DEFAULT_OUTCOMES: StepOutcome[] = ['進行中', '通過', '拒絕'];
const FINAL_OUTCOMES: StepOutcome[] = ['拒絕', '通過'];


@Injectable({
  providedIn: 'root'
})
export class ProcessService {
  // 使用微服務專用的 API URL
  private apiUrl = environment.apiUrl; // 使用 /api，nginx 會將 /api/processes 路由到 process-service

  constructor(private http: HttpClient) { }

  // 招募階段只保留候選人實際前進的關卡；主管回覆狀態另由 taskStatus 表示。
  private defaultSteps: ProcessStep[] = [
    { id: 1, label: '初審', possibleOutcomes: DEFAULT_OUTCOMES },
    { id: 4, label: '一面', possibleOutcomes: DEFAULT_OUTCOMES },
    { id: 5, label: '聯合面試', possibleOutcomes: DEFAULT_OUTCOMES },
    { id: 6, label: '人選會', possibleOutcomes: DEFAULT_OUTCOMES },
    { id: 7, label: '錄取', possibleOutcomes: DEFAULT_OUTCOMES },
    { id: 8, label: '人選任用', possibleOutcomes: DEFAULT_OUTCOMES },
    { id: 9, label: '人選到職', possibleOutcomes: FINAL_OUTCOMES }
  ];
  // 取得 token 的私有方法
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('gcp_id_token');
    if (!token) {
      throw new Error('未找到認證 token，請重新登入');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // 部門特定的流程步驟集合 (為未來擴展準備)
  private departmentSteps: { [department: string]: ProcessStep[] } = {
    // 例如: '技術部': [...特定流程步驟]
  };

  // 根據部門獲取適用的流程步驟
  // 如果沒有指定部門或找不到部門特定步驟，則返回默認步驟
  getSteps(department?: string): ProcessStep[] {
    if (department && this.departmentSteps[department]) {
      return this.departmentSteps[department];
    }
    return this.defaultSteps;
  }

  // 獲取適用於PrimeNG Steps元件的格式
  getStepItems(department?: string): { label: string }[] {
    return this.getSteps(department).map(step => ({ label: step.label }));
  }

  getStepIndexById(stepId: number, department?: string): number {
    const steps = this.getSteps(department);
    return Math.max(0, steps.findIndex(step => step.id === stepId));
  }

  // 根據 ID 獲取步驟標籤
  getStepLabelById(stepId: number, department?: string): string {
    const steps = this.getSteps(department);
    const step = steps.find(s => s.id === stepId);
    return step ? step.label : `未知步驟 (${stepId})`;
  }

}
