import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible() && notificationService.shouldShowBanner()) {
    <div class="notification-banner-wrapper">
      <div class="notification-banner shadow-premium animate-in slide-in-from-top-8 duration-700">
        <button (click)="onDismiss()" class="close-btn">
          <span class="material-icons">close</span>
        </button>

        <div class="banner-content">
          <div class="icon-container">
            <span class="material-icons notify-icon">notifications_active</span>
          </div>

          <div class="text-container">
            <h3 class="banner-title">Get order updates instantly</h3>
            <p class="banner-description">Enable notifications to receive real-time updates about your order.</p>
          </div>

          <button (click)="onEnable()" class="enable-btn">
            <span>Enable</span>
          </button>
        </div>
      </div>
    </div>
    }
  `,
  styles: [`
    .notification-banner-wrapper {
      margin: 1rem 0;
      padding: 0;
    }

    .notification-banner {
      position: relative;
      background: linear-gradient(105deg, #6366f1 0%, #4f46e5 100%);
      border-radius: 1.5rem;
      padding: 1rem 1.25rem;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 12px 30px rgba(79, 70, 229, 0.2);
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .icon-container {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 1rem;
    }

    .notify-icon {
      font-size: 24px;
      color: white;
    }

    .text-container {
      flex: 1;
      min-width: 0;
    }

    .banner-title {
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 800;
      color: white;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .banner-description {
      font-size: 0.75rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
      line-height: 1.3;
    }

    .enable-btn {
      background: white;
      color: #4f46e5;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 0.8rem;
      font-weight: 800;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .enable-btn:active {
      transform: scale(0.95);
    }

    .close-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 24px;
      height: 24px;
      font-size: 14px;
      opacity: 0.6;
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
    }

    @media (max-width: 480px) {
      .banner-description {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `]
})
export class NotificationBannerComponent {
  notificationService = inject(NotificationService);
  isVisible = signal(true);

  async onEnable() {
    const granted = await this.notificationService.requestPermission();
    if (granted) {
      this.isVisible.set(false);
      this.notificationService.addNotification(
        'Notifications Enabled! 🔔',
        'You will now receive live updates for your orders.',
        'success'
      );
    }
  }

  onDismiss() {
    this.isVisible.set(false);
  }
}
