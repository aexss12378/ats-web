import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { TabsComponent } from "../../components/tabs/tabs.component";
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { BadgeModule } from 'primeng/badge';
import { ListboxModule } from 'primeng/listbox';
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job.model';


@Component({
  selector: 'app-job-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    TabsComponent,
    FileUploadModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    DialogModule,
    MessageModule,
    BadgeModule,
    ListboxModule
  ],
  templateUrl: './job-upload.component.html',
  styleUrls: ['./job-upload.component.css']
})
export class JobUploadComponent implements OnInit {
  jobForm!: FormGroup;
  resumeForm!: FormGroup;
  jobs: Job[] = [];
  selectedJob: Job | null = null;
  displayUploadDialog: boolean = false;
  uploadedFiles: any[] = [];

  constructor(private fb: FormBuilder, private jobService: JobService) {}

  ngOnInit(): void {
    this.jobForm = this.fb.group({
      jobTitle: ['', Validators.required]
    });

    this.resumeForm = this.fb.group({
      resumeUpload: [null]
    });

    this.loadJobs();
  }

  // 取得所有職缺列表
  loadJobs(): void {
    this.jobService.getJobs().subscribe(jobs => {
      this.jobs = jobs.map(job => ({
        ...job,
        jobStatus: job.jobStatus ?? (job as any).status,
        applicantCount: job.applicantCount ?? job.applicants?.length ?? 0,
        applicants: job.applicants ?? []
      }));
    });
  }

  // 建立職缺
  createJob(): void {
    if (this.jobForm.invalid) {
      this.jobForm.markAllAsTouched();

      const btn = document.querySelector('button[type="submit"]');
      btn?.classList.remove('shake');
      void (btn as HTMLElement)?.offsetWidth; // 觸發 reflow，讓動畫能重新播放
      btn?.classList.add('shake');

      return;
    }

    const title = this.jobForm.value.jobTitle;

    this.jobService.createJob(title).subscribe(newJob => {
      this.jobs.push(newJob);
      this.jobForm.reset();
      alert('職缺已成功建立');
    });
  }

  // 點選職缺並打開上傳履歷對話框
  selectJob(jobId: number): void {
    this.selectedJob = this.jobs.find(j => j.id === jobId) || null;
    this.displayUploadDialog = true;
  }

  // 刪除職缺
  deleteJob(jobId: number): void {
    if (!confirm('確定要刪除嗎？')) return;

    this.jobService.deleteJob(jobId).subscribe(() => {
      this.jobs = this.jobs.filter(job => job.id !== jobId);
      if (this.selectedJob?.id === jobId) {
        this.selectedJob = null;
      }
    });
  }

  // 上傳履歷
  onUpload(event: any): void {
    const file = event.files[0];
    if (file) {
      this.resumeForm.patchValue({ resumeUpload: file });
    }
  }


}
