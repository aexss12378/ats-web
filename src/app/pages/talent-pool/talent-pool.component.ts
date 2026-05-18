import { Component, OnDestroy, OnInit } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { TabsComponent } from '../../components/tabs/tabs.component';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

interface TalentCandidate {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  avatar: string;
  skills: string[];
  status: string;
  matchScore: number;
  updatedAt: string;
  details: {
    email: string;
    location: string;
    about: string;
    education: string;
    experience: Array<{
      company: string;
      title: string;
      period: string;
      description: string;
    }>;
    links: Array<{ label: string; url: string }>;
  };
}

interface TalentQuery {
  keyword: string;
  job: string | null;
  skills: string | null;
  experience: string | null;
  sort: string;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-talent-pool',
  imports: [HeaderComponent, TabsComponent, CommonModule, DialogModule, FormsModule, SelectModule],
  templateUrl: './talent-pool.component.html',
  styleUrl: './talent-pool.component.css'
})
export class TalentPoolComponent implements OnInit, OnDestroy {
  private keywordChanges = new Subject<string>();
  private keywordSubscription?: Subscription;

  selectedCandidateIds = new Set<string>();
  activeCandidate: TalentCandidate | null = null;
  selectedCard: TalentCandidate | null = null;
  showDetail = false;
  isLoading = false;

  pagedCandidates: TalentCandidate[] = [];
  totalRecords = 0;
  totalPages = 1;

  query: TalentQuery = {
    keyword: '',
    job: null,
    skills: null,
    experience: null,
    sort: 'updatedDesc',
    page: 1,
    pageSize: 10
  };

  cards: TalentCandidate[] = [
    {
      id: 'talent-001',
      title: '王小明',
      subtitle: '前端工程師',
      content: '擅長 Angular、TypeScript，熱愛 UI/UX 設計。',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      skills: ['Angular', 'TypeScript', 'HTML'],
      status: '可追蹤',
      matchScore: 86,
      updatedAt: '2026-05-07T09:30:00.000Z',
      details: {
        email: 'xiaoming@example.com',
        location: '台北市',
        about: '我是一名前端開發者，注重可讀性與團隊合作。擁有豐富的專案經驗，善於溝通與解決問題。',
        education: '3年',
        experience: [
          {
            company: '甲公司',
            title: '前端工程師',
            period: '2021 - 現在',
            description: '開發 Angular 後台系統，優化 UI/UX 流程。'
          },
          {
            company: '乙公司',
            title: '切版工程師',
            period: '2019 - 2021',
            description: '負責網站切版與互動動畫實作。'
          }
        ],
        links: [
          { label: 'GitHub', url: 'https://github.com/xiaoming' },
          { label: '作品集', url: 'https://portfolio.xiaoming.com' }
        ]
      }
    },
    {
      id: 'talent-002',
      title: '陳美麗',
      subtitle: 'UI 設計師',
      content: '熟悉 Figma、Sketch，喜歡設計溫暖的產品體驗。',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      skills: ['Figma', 'Sketch', 'Photoshop'],
      status: '可追蹤',
      matchScore: 79,
      updatedAt: '2026-05-04T11:15:00.000Z',
      details: {
        email: 'meili@example.com',
        location: '新北市',
        about: '熱愛設計並關注使用者體驗。與前端開發團隊合作密切。',
        education: '2年',
        experience: [
          {
            company: '丙設計公司',
            title: 'UI 設計師',
            period: '2020 - 現在',
            description: '設計 App 介面並建立設計系統。'
          }
        ],
        links: [
          { label: 'Behance', url: 'https://behance.net/meili' }
        ]
      }
    }
  ];

  jobOptions: { label: string, value: string }[] = [];
  skillOptions: { label: string, value: string }[] = [];
  experienceOptions: { label: string, value: string }[] = [];
  sortOptions = [
    { label: '最近更新', value: 'updatedDesc' },
    { label: '匹配度高到低', value: 'scoreDesc' },
    { label: '年資高到低', value: 'experienceDesc' },
    { label: '姓名 A-Z', value: 'nameAsc' }
  ];
  pageSizeOptions = [
    { label: '10 / 頁', value: 10 },
    { label: '20 / 頁', value: 20 },
    { label: '50 / 頁', value: 50 }
  ];

  ngOnInit() {
    this.generateFilterOptionsFromCards();
    this.keywordSubscription = this.keywordChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(keyword => {
        this.query.keyword = keyword;
        this.query.page = 1;
        this.loadCandidates();
      });
    this.loadCandidates();
  }

  ngOnDestroy() {
    this.keywordSubscription?.unsubscribe();
  }

  generateFilterOptionsFromCards() {
    const jobSet = new Set(this.cards.map(card => card.subtitle));
    this.jobOptions = Array.from(jobSet).map(job => ({ label: job, value: job }));

    const allSkills = this.cards.flatMap(card => card.skills || []);
    const skillSet = new Set(allSkills);
    this.skillOptions = Array.from(skillSet).map(skill => ({ label: skill, value: skill }));

    const allExperience = this.cards.map(card => card.details.education);
    const experienceSet = new Set(allExperience);
    this.experienceOptions = Array.from(experienceSet).map(experience => ({ label: experience, value: experience }));
  }

  onKeywordChange(keyword: string) {
    this.keywordChanges.next(keyword);
  }

  applyFilters() {
    this.query.page = 1;
    this.loadCandidates();
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.query.page) {
      return;
    }
    this.query.page = page;
    this.loadCandidates();
  }

  clearFilters() {
    this.query = {
      keyword: '',
      job: null,
      skills: null,
      experience: null,
      sort: 'updatedDesc',
      page: 1,
      pageSize: this.query.pageSize
    };
    this.loadCandidates();
  }

  viewDetail(candidate: TalentCandidate) {
    this.activeCandidate = candidate;
    this.selectedCard = candidate;
    this.showDetail = true;
  }

  selectCandidate(candidate: TalentCandidate) {
    this.activeCandidate = candidate;
  }

  toggleCandidateSelection(candidate: TalentCandidate, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedCandidateIds.add(candidate.id);
    } else {
      this.selectedCandidateIds.delete(candidate.id);
    }
  }

  isSelected(candidate: TalentCandidate): boolean {
    return this.selectedCandidateIds.has(candidate.id);
  }

  addSelectedToTrackingList() {
    alert(`已將 ${this.selectedCount} 位人才加入追蹤清單`);
  }

  get selectedCount(): number {
    return this.selectedCandidateIds.size;
  }

  get pageStart(): number {
    return this.totalRecords === 0 ? 0 : (this.query.page - 1) * this.query.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.query.page * this.query.pageSize, this.totalRecords);
  }

  private loadCandidates() {
    this.isLoading = true;
    const result = this.queryCandidates(this.query);
    this.pagedCandidates = result.items;
    this.totalRecords = result.total;
    this.totalPages = Math.max(1, Math.ceil(this.totalRecords / this.query.pageSize));
    this.activeCandidate = this.activeCandidate
      ? this.pagedCandidates.find(candidate => candidate.id === this.activeCandidate?.id) ?? this.pagedCandidates[0] ?? null
      : this.pagedCandidates[0] ?? null;
    this.isLoading = false;
  }

  private queryCandidates(query: TalentQuery): { items: TalentCandidate[]; total: number } {
    const keyword = query.keyword.trim().toLowerCase();
    let candidates = this.cards.filter(candidate => {
      const keywordMatch = keyword
        ? [
          candidate.title,
          candidate.subtitle,
          candidate.content,
          candidate.details.email,
          candidate.details.location,
          ...candidate.skills
        ].some(value => value.toLowerCase().includes(keyword))
        : true;
      const jobMatch = query.job ? candidate.subtitle === query.job : true;
      const experienceMatch = query.experience ? candidate.details.education === query.experience : true;
      const skillMatch = query.skills ? candidate.skills.includes(query.skills) : true;

      return keywordMatch && jobMatch && experienceMatch && skillMatch;
    });

    candidates = [...candidates].sort((a, b) => {
      if (query.sort === 'scoreDesc') {
        return b.matchScore - a.matchScore;
      }
      if (query.sort === 'experienceDesc') {
        return this.getExperienceYears(b) - this.getExperienceYears(a);
      }
      if (query.sort === 'nameAsc') {
        return a.title.localeCompare(b.title, 'zh-Hant');
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const start = (query.page - 1) * query.pageSize;
    const items = candidates.slice(start, start + query.pageSize);
    return { items, total: candidates.length };
  }

  private getExperienceYears(candidate: TalentCandidate): number {
    const match = candidate.details.education.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }
}
