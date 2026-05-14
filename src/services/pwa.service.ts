import { Injectable, signal, PLATFORM_ID, inject, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  
  // Signal to track if the app is installable
  isInstallable = signal<boolean>(false);
  
  // Deferred prompt to trigger later
  private deferredPrompt: any;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Check if the banner was dismissed recently (within 24 hours)
      const dismissed = localStorage.getItem('pwa-banner-dismissed');
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) {
          return; // Don't set up listeners if dismissed recently
        }
        localStorage.removeItem('pwa-banner-dismissed');
      }

      // DEBUG: Force show for testing if URL has ?testPwa=true
      if (window.location.search.includes('testPwa=true')) {
        this.isInstallable.set(true);
      }

      // The beforeinstallprompt event may fire before Angular hydration.
      // We use NgZone.run to ensure Angular picks up the signal change.
      const handler = (e: Event) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.ngZone.run(() => {
          this.isInstallable.set(true);
          console.log('[PWA] beforeinstallprompt event fired — install banner should be visible');
        });
      };

      window.addEventListener('beforeinstallprompt', handler);

      window.addEventListener('appinstalled', () => {
        this.ngZone.run(() => {
          this.isInstallable.set(false);
          this.deferredPrompt = null;
          console.log('[PWA] App installed successfully');
        });
      });
    }
  }

  async installApp() {
    if (!this.deferredPrompt) {
      console.warn('[PWA] No deferred prompt available. Install may not be supported.');
      return;
    }
    
    // Show the install prompt
    this.deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const result = await this.deferredPrompt.userChoice;
    console.log('[PWA] User choice:', result.outcome);
    
    // We've used the prompt, and can't use it again, throw it away
    this.deferredPrompt = null;
    this.isInstallable.set(false);
  }

  dismissInstall() {
    this.isInstallable.set(false);
    // Store timestamp so we can show again after 24 hours
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  }
}
