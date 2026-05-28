import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoogleAnalyticsService {
  /**
   * Send custom events to Google Analytics (GA4)
   */
  trackEvent(eventName: string, payload?: Record<string, any>): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, payload);
    } else {
      console.warn(`[GA4] gtag is not loaded. Event "${eventName}" skipped.`, payload);
    }
  }
}
