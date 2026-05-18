import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Applicant {
  name: string;
  education: string;
  experience: number;
  lastCompany: string;
  skills: string;
  resumeUrl: string;
  appliedDate: string;
}

@Component({
  selector: 'app-applicant-list',
  imports: [FormsModule, CommonModule],
  templateUrl: './applicant-list.component.html',
  styleUrl: './applicant-list.component.css'
})
export class ApplicantListComponent {
  @Input() jobTitle: string = '';
  @Input() applicants: Applicant[] = [];

  filterStatus = '';
  filterSource = '';
  keyword = '';

  get filteredApplicants(): Applicant[] {
    return this.applicants.filter(applicant => {
      const matchKeyword = !this.keyword || applicant.name.includes(this.keyword) || applicant.skills.includes(this.keyword);
      return matchKeyword;
    });
  }
}
