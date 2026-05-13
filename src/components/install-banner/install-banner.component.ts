import { Component, inject, OnInit, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../services/pwa.service';
import gsap from 'gsap';

@Component({
  selector: 'app-install-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './install-banner.component.html',
  styleUrl: './install-banner.component.css'
})
export class InstallBannerComponent {
  pwaService = inject(PwaService);
  private el = inject(ElementRef);

  constructor() {
    // Re-run animation whenever it becomes installable
    effect(() => {
      if (this.pwaService.isInstallable()) {
        setTimeout(() => this.animateIn(), 100);
      }
    });
  }

  private animateIn() {
    const banner = this.el.nativeElement.querySelector('.install-banner');
    const icon = this.el.nativeElement.querySelector('.icon-container');
    const text = this.el.nativeElement.querySelector('.text-container');
    const btn = this.el.nativeElement.querySelector('.install-btn');

    if (banner) {
      gsap.fromTo(banner, 
        { y: 50, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'expo.out' }
      );

      gsap.fromTo([icon, text, btn],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out', delay: 0.3 }
      );
    }
  }

  onInstall() {
    this.pwaService.installApp();
  }

  onDismiss() {
    const banner = this.el.nativeElement.querySelector('.install-banner');
    gsap.to(banner, {
      y: 30,
      opacity: 0,
      scale: 0.95,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => this.pwaService.dismissInstall()
    });
  }
}

