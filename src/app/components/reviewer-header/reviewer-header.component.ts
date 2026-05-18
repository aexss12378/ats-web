import { Component, Input } from '@angular/core'; // 引入 Angular 的 Component 和 Input 裝飾器

@Component({
  selector: 'app-reviewer-header',
  imports: [],
  templateUrl: './reviewer-header.component.html',
  styleUrl: './reviewer-header.component.css'
})
export class ReviewerHeaderComponent {
  @Input() title: string = ''; // 接收標題
}
