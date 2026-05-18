import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  @Input() tabs: { label: string; path: string; icon?: string }[] = []; // 接收外部傳入的 tabs 資料
  @Input() activeTab: string = ''; // 接收當前的活動頁面路徑
}
