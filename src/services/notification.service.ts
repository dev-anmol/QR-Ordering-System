import { Injectable, signal, PLATFORM_ID, inject, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  time: Date;
  isRead: boolean;
  type: 'status' | 'info' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private platformId = inject(PLATFORM_ID);
  
  // Browser Permission
  permissionStatus = signal<NotificationPermission>('default');
  
  // In-App Notifications List
  notifications = signal<InAppNotification[]>([]);
  
  // Unread Count
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      if ('Notification' in window) {
        this.permissionStatus.set(Notification.permission);
      }
      
      // Load from localStorage if available
      const saved = localStorage.getItem('dinesphere_notifications');
      if (saved) {
        try {
          this.notifications.set(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved notifications');
        }
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId) || !('Notification' in window)) {
      console.warn('[Notification] Not supported in this environment');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus.set(permission);
      console.log('[Notification] Permission result:', permission);
      
      if (permission === 'denied') {
        console.warn('[Notification] Permission denied. User must reset in browser settings.');
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('[Notification] Error requesting permission:', error);
      return false;
    }
  }

  addNotification(title: string, message: string, type: 'status' | 'info' | 'success' = 'info') {
    const newNotify: InAppNotification = {
      id: Math.random().toString(36).substring(2),
      title,
      message,
      time: new Date(),
      isRead: false,
      type
    };

    // Update list
    this.notifications.update(prev => [newNotify, ...prev].slice(0, 20)); // Keep last 20
    this.saveToStorage();

    // Show browser notification if granted
    this.showBrowserNotification(title, message);
  }

  private async showBrowserNotification(title: string, body: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Check if we have permission
    if (!('Notification' in window) || this.permissionStatus() !== 'granted') {
      console.log('[Notification] Skipping browser notification — permission:', this.permissionStatus());
      return;
    }

    const options: any = {
      body,
      icon: '/assets/images/icon-192x192.png',
      badge: '/assets/images/icon-192x192.png',
      vibrate: [200, 100, 200],
      tag: 'dinesphere-order-update', // Replaces previous notification instead of stacking
      renotify: true
    };

    try {
      // Prefer Service Worker notification (works when tab is in background / on mobile)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, options);
          console.log('[Notification] Sent via Service Worker');
          return;
        }
      }

      // Fallback to legacy Notification API (desktop foreground only)
      new Notification(title, options);
      console.log('[Notification] Sent via legacy Notification API');
    } catch (error) {
      console.error('[Notification] Failed to show notification:', error);
    }
  }

  markAllAsRead() {
    this.notifications.update(prev => prev.map(n => ({ ...n, isRead: true })));
    this.saveToStorage();
  }

  clearAll() {
    this.notifications.set([]);
    this.saveToStorage();
  }

  private saveToStorage() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('dinesphere_notifications', JSON.stringify(this.notifications()));
    }
  }

  shouldShowBanner(): boolean {
    if (!isPlatformBrowser(this.platformId) || !('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'default';
  }
}
