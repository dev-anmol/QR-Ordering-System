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
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permissionStatus.set(permission);
    return permission === 'granted';
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
    if (isPlatformBrowser(this.platformId) && 'Notification' in window && this.permissionStatus() === 'granted') {
      const options = {
        body,
        icon: 'assets/images/logo.png',
        badge: 'assets/images/logo.png',
        vibrate: [200, 100, 200]
      };

      // Prefer Service Worker notification if available (better for PWA/Mobile)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          registration.showNotification(title, options);
          return;
        }
      }

      // Fallback to legacy Notification API
      new Notification(title, options);
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
