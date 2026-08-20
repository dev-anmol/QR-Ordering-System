import {Component, inject, PLATFORM_ID, signal, WritableSignal} from '@angular/core';
import {isPlatformBrowser, CommonModule} from '@angular/common';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {inject as analyticsInject} from '@vercel/analytics';
import {AlertService} from '../services/alert/alert.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private router = inject(Router);
  currentRoute: WritableSignal<string> = signal('');
  public alertService = inject(AlertService);

  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      analyticsInject();

      // Globally override window.alert at the root component level
      window.alert = (message: string) => {
        let title = 'Notification';
        let type: 'success' | 'warning' | 'error' | 'info' = 'info';
        
        const lower = String(message).toLowerCase();
        if (lower.includes('failed') || lower.includes('error') || lower.includes('unable') || lower.includes('could not')) {
          title = 'Service Error';
          type = 'error';
        } else if (lower.includes('success') || lower.includes('saved') || lower.includes('completed') || lower.includes('successfully') || lower.includes('received') || lower.includes('sent') || lower.includes('requested')) {
          title = 'Action Successful';
          type = 'success';
        } else if (lower.includes('warning') || lower.includes('expired') || lower.includes('invalid') || lower.includes('already') || lower.includes('attention') || lower.includes('pending') || lower.includes('no orders')) {
          title = 'Attention Required';
          type = 'warning';
        }
        
        this.alertService.show(title, message, type);
      };
    }
    
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.currentRoute.set(e.url);
      }
    });
  }
}
