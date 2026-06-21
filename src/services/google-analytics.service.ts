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
      // Extract global parameters
      const restaurant_id = localStorage.getItem('restaurant_id') || 'unknown';
      const table_id = localStorage.getItem('table_id') || 'unknown';
      const guest_id = this.getCookie('customer_session') || localStorage.getItem('customer_device_id') || 'unknown';

      const enrichedPayload = {
        ...payload,
        restaurant_id,
        table_id,
        guest_id
      };

      (window as any).gtag('event', eventName, enrichedPayload);
    } else {
      console.warn(`[GA4] gtag is not loaded. Event "${eventName}" skipped.`, payload);
    }
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
}
