import { Routes } from '@angular/router';
import { JobUploadComponent } from './pages/job-upload/job-upload.component';
import { ResumeScreeningComponent } from './pages/resume-screening/resume-screening.component';
import { InterviewSchedulingComponent } from './pages/interview-scheduling/interview-scheduling.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TalentPoolComponent } from './pages/talent-pool/talent-pool.component';
import { SupervisorScreenApplicantComponent } from './pages/supervisor-screen-applicant/supervisor-screen-applicant.component';
import { SupervisorInterviewComponent } from './pages/supervisor-interview/supervisor-interview.component';
import { SupervisorRatingComponent } from './pages/supervisor-rating/supervisor-rating.component';
import { SupervisorDecisionComponent } from './pages/supervisor-decision/supervisor-decision.component';
import { InterviewerInterviewComponent } from './pages/interviewer-interview/interviewer-interview.component';
import { InterviewerRatingComponent } from './pages/interviewer-rating/interviewer-rating.component';

export const routes: Routes = [
  { path: '', redirectTo: 'jobs', pathMatch: 'full'}, // redirect to the default route
  { path: 'jobs', component: JobUploadComponent },
  { path: 'resume-screening', component: ResumeScreeningComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'interview-scheduling', component: InterviewSchedulingComponent },
  { path: 'talent-pool', component: TalentPoolComponent },
  { path: 'supervisor-screen-applicant', component: SupervisorScreenApplicantComponent },
  { path: 'supervisor-interview', redirectTo: 'supervisor-interview/1', pathMatch: 'full' },
  { path: 'supervisor-interview/:supervisorId', component: SupervisorInterviewComponent },
  { path: 'supervisor-rating', component: SupervisorRatingComponent },
  { path: 'supervisor-decision', component: SupervisorDecisionComponent },
  { path: 'interviewer-interview', component: InterviewerInterviewComponent },
  { path: 'interviewer-rating', component: InterviewerRatingComponent },
  // 以後可以加：
  // { path: 'dashboard', component: DashboardComponent }
];

