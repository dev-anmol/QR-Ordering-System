import {Component, inject, PLATFORM_ID, signal, WritableSignal} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {inject as analyticsInject} from '@vercel/analytics';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private router = inject(Router);
  currentRoute: WritableSignal<string> = signal('');

  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      analyticsInject();
    }
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.currentRoute.set(e.url);
      }
    });
  }
}
