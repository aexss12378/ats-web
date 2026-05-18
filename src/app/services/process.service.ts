import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { ProcessStep, StepOutcome } from '../models/process.model';

const DEFAULT_OUTCOMES: StepOutcome[] = ['進行中', '通過', '拒絕'];
const FINAL_OUTCOMES: StepOutcome[] = ['拒絕', '通過'];

@Injectable({
  providedIn: 'root'
})
export class ProcessService {
  private apiUrl = environment.apiUrl;

  private defaultSteps: ProcessStep[] = [
    { id: 1, label: '初審', possibleOutcomes: DEFAULT_OUTCOMES },
    { id: 4, label: '一面', possibleOutcomes: DEFAULT_OUTCOMES },
    { id: 5, label: '聯合面試', possibleOutcomes: DEFAULT_OUTCOMES },
    { id: 6, label: '人選會', possibleOutcomes: DEFAULT_OUTCOMES },
    { id: 7, label: '錄取', possibleOutcomes: DEFAULT_OUTCOMES },
    { id: 8, label: '人選任用', possibleOutcomes: DEFAULT_OUTCOMES },
    { id: 9, label: '人選到職', possibleOutcomes: FINAL_OUTCOMES }
  ];

  private departmentSteps: { [department: string]: ProcessStep[] } = {};

  getSteps(department?: string): ProcessStep[] {
    if (department && this.departmentSteps[department]) {
      return this.departmentSteps[department];
    }
    return this.defaultSteps;
  }

  getStepItems(department?: string): { label: string }[] {
    return this.getSteps(department).map(step => ({ label: step.label }));
  }

  getStepIndexById(stepId: number, department?: string): number {
    const steps = this.getSteps(department);
    return Math.max(0, steps.findIndex(step => step.id === stepId));
  }

  getStepLabelById(stepId: number, department?: string): string {
    const steps = this.getSteps(department);
    const step = steps.find(s => s.id === stepId);
    return step ? step.label : `未知步驟 (${stepId})`;
  }
}
