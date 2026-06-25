import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoogleAnalyticsService {
  private isScriptLoaded = false;
  private readonly MEASUREMENT_ID = 'G-48HFCQTKD3';
  private readonly IMPORTANT_EVENTS = ['add_to_cart', 'begin_checkout', 'purchase'];

  /**
   * Send custom events to Google Analytics (GA4)
   */
  trackEvent(eventName: string, payload?: Record<string, any>): void {
    if (typeof window === 'undefined') return;

    // Filter events: only track important events to optimize performance
    if (!this.IMPORTANT_EVENTS.includes(eventName)) {
      return;
    }

    // Lazily load Google Tag script when the first important event is fired
    this.ensureGtagLoaded();

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

    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', eventName, enrichedPayload);
    }
  }

  private ensureGtagLoaded(): void {
    if (this.isScriptLoaded) return;
    
    // Initialize dataLayer and gtag queue
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = (window as any).gtag || function() {
      (window as any).dataLayer.push(arguments);
    };
    
    (window as any).gtag('js', new Date());
    (window as any).gtag('config', this.MEASUREMENT_ID);

    // Inject the script element
    if (typeof document !== 'undefined') {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.MEASUREMENT_ID}`;
      document.head.appendChild(script);
      this.isScriptLoaded = true;
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
