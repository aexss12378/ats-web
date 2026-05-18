import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tabs',
  imports: [CommonModule, RouterModule],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.css'
})
export class TabsComponent {
  tabs = [
    { label: '履歷與職缺', path: '/jobs', icon: 'pi pi-briefcase' },
    { label: '初審履歷', path: '/resume-screening', icon: 'pi pi-file-check' },
    { label: 'Dashboard', path: '/dashboard', icon: 'pi pi-chart-line' },
    { label: '面試安排', path: '/interview-scheduling', icon: 'pi pi-calendar-plus' },
    { label: '人才庫', path: '/talent-pool', icon: 'pi pi-users' }
  ];

}
