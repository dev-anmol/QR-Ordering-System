import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private platformId = inject(PLATFORM_ID);
  
  // Signal to track if the app is installable
  isInstallable = signal<boolean>(false);
  
  // Deferred prompt to trigger later
  private deferredPrompt: any;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // DEBUG: Force show for testing if URL has ?testPwa=true
      if (window.location.search.includes('testPwa=true')) {
        this.isInstallable.set(true);
      }

      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        this.deferredPrompt = e;
        // Update the signal to show our custom banner
        this.isInstallable.set(true);
      });

      window.addEventListener('appinstalled', () => {
        this.isInstallable.set(false);
        this.deferredPrompt = null;
      });
    }
  }

  async installApp() {
    if (!this.deferredPrompt) {
      return;
    }
    
    // Show the install prompt
    this.deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    await this.deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    this.deferredPrompt = null;
    this.isInstallable.set(false);
  }

  dismissInstall() {
    this.isInstallable.set(false);
    // Optionally store in localStorage to not show again for a while
    localStorage.setItem('pwa-banner-dismissed', 'true');
  }
}
