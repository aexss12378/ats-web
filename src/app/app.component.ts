import { Component, OnInit, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

declare const google: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'my-angular-app';
  token: string | null = null;

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    // 移除 localStorage 檢查，每次都需要重新登入
    this.token = localStorage.getItem('gcp_id_token');
    if (!this.token && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      this.token = 'dev-token';
      localStorage.setItem('gcp_id_token', this.token);
    }

    // 等待一點時間確保 DOM 和 Google API 都已載入
    setTimeout(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        this.initializeGoogleSignIn();
      } else {
        console.error('Google API 尚未載入');
      }
    }, 500);
  }

  private initializeGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: '905160398066-36uldv3l1n8nbq6mfps4i7kagmoqkeqa.apps.googleusercontent.com', // 請替換為實際的 Client ID
      callback: (response: any) => {
        // 使用 NgZone 確保 Angular 偵測到變更
        this.ngZone.run(() => {
          this.token = response.credential;
          if (this.token) {
            localStorage.setItem('gcp_id_token', this.token);
            console.log('登入成功');
          }
        });
      }
    });

    const buttonElement = document.getElementById('g_id_signin');
    if (buttonElement) {
      google.accounts.id.renderButton(
        buttonElement,
        { theme: "outline", size: "large" }
      );
    }
  }

  // 簡化登出方法
  signOut() {
    this.token = null;
    localStorage.removeItem('gcp_id_token');
    google.accounts.id.disableAutoSelect();
    console.log('已登出');
  }

  // 檢查是否已登入
  isSignedIn(): boolean {
    return !!this.token;
  }
}
