import { Component, inject, OnInit, HostListener } from '@angular/core';
import { Header } from '../../components/header/header';
import { RouterOutlet, Router } from '@angular/router';
import { Footer } from '../../components/footer/footer';
import { BottomNav } from '../../components/bottom-nav/bottom-nav';
import { CommonModule } from '@angular/common';
import { TableRequestService } from '../../services/table-request/table-request.service';
import { AlertService } from '../../services/alert/alert.service';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [
    Header,
    RouterOutlet,
    Footer,
    BottomNav,
    CommonModule
  ],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent implements OnInit {
  private router = inject(Router);
  private requestService = inject(TableRequestService);
  public alertService = inject(AlertService);

  // Drag-and-drop state properties
  buttonX: number | null = null;
  buttonY: number | null = null;
  isDragging = false;
  
  private dragStartX = 0;
  private dragStartY = 0;
  private initialX = 0;
  private initialY = 0;
  private dragDistance = 0;
  private buttonWidth = 0;
  private buttonHeight = 0;



  ngOnInit() {
    this.loadPosition();
  }

  loadPosition() {
    if (typeof window !== 'undefined') {
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;
      
      // Delay initialization if the viewport dimensions are not fully ready/ready as 0
      if (winWidth < 100 || winHeight < 100) {
        setTimeout(() => this.loadPosition(), 50);
        return;
      }

      let savedX = null;
      let savedY = null;
      if (typeof localStorage !== 'undefined') {
        savedX = localStorage.getItem('bell_x_percent');
        savedY = localStorage.getItem('bell_y_percent');
      }

      const xPercent = savedX !== null ? parseFloat(savedX) : null;
      const yPercent = savedY !== null ? parseFloat(savedY) : null;

      if (xPercent !== null && yPercent !== null && !isNaN(xPercent) && !isNaN(yPercent)) {
        this.buttonX = (xPercent / 100) * winWidth;
        this.buttonY = (yPercent / 100) * winHeight;
      } else {
        // Default to a middle-right position (65% height, 16px from right margin)
        this.buttonX = winWidth - (this.buttonWidth || 64) - 16;
        this.buttonY = winHeight * 0.65;
      }
      this.clampPosition(winWidth, winHeight);
    }
  }

  clampPosition(winWidth: number, winHeight: number) {
    if (this.buttonX !== null && this.buttonY !== null && winWidth > 100 && winHeight > 100) {
      const w = this.buttonWidth || 64;
      const h = this.buttonHeight || 64;
      const margin = 16;

      // X boundaries: keep inside screen horizontally
      if (this.buttonX < margin) this.buttonX = margin;
      if (this.buttonX > winWidth - w - margin) this.buttonX = winWidth - w - margin;

      // Y boundaries: keep strictly in middle part only (dont go top)
      // Min Y: 30% of viewport height (keeps it away from top header)
      let topLimit = winHeight * 0.30;

      // Default Max Y: 80% of viewport height
      let bottomLimit = winHeight * 0.80 - h;

      // Get bottom nav (mobile)
      const bottomNav = typeof document !== 'undefined' 
        ? (document.querySelector('app-bottom-nav nav') || document.querySelector('app-bottom-nav div')) 
        : null;
      if (bottomNav) {
        const navRect = bottomNav.getBoundingClientRect();
        if (navRect.height > 0 && navRect.top > 0) {
          bottomLimit = Math.min(bottomLimit, navRect.top - h - margin);
        }
      }

      // Get floating basket bar or similar elements
      const basketBar = typeof document !== 'undefined' ? document.querySelector('.fixed.bottom-\\[110px\\]') : null;
      if (basketBar) {
        const basketRect = basketBar.getBoundingClientRect();
        if (basketRect.height > 0 && basketRect.top > 0) {
          bottomLimit = Math.min(bottomLimit, basketRect.top - h - margin);
        }
      }

      // Get cart summary/checkout card if visible
      const summaryCard = typeof document !== 'undefined' ? document.querySelector('.summary-card') : null;
      if (summaryCard) {
        const cardRect = summaryCard.getBoundingClientRect();
        if (cardRect.height > 0 && cardRect.top > 0) {
          bottomLimit = Math.min(bottomLimit, cardRect.top - h - margin);
        }
      }

      // Sanity check
      if (bottomLimit < topLimit) {
        bottomLimit = winHeight - h - margin;
      }

      if (this.buttonY < topLimit) this.buttonY = topLimit;
      if (this.buttonY > bottomLimit) this.buttonY = bottomLimit;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if (typeof window !== 'undefined') {
      let savedX = null;
      let savedY = null;
      if (typeof localStorage !== 'undefined') {
        savedX = localStorage.getItem('bell_x_percent');
        savedY = localStorage.getItem('bell_y_percent');
      }

      if (savedX !== null && savedY !== null) {
        const xPercent = parseFloat(savedX);
        const yPercent = parseFloat(savedY);
        this.buttonX = (xPercent / 100) * window.innerWidth;
        this.buttonY = (yPercent / 100) * window.innerHeight;
      } else {
        this.buttonX = window.innerWidth - (this.buttonWidth || 64) - 16;
        this.buttonY = window.innerHeight * 0.65;
      }
      this.clampPosition(window.innerWidth, window.innerHeight);
    }
  }

  onDragStart(event: MouseEvent | TouchEvent, buttonElement: HTMLElement) {
    if (!this.isWaiterAllowed()) return;

    // Get element size
    const rect = buttonElement.getBoundingClientRect();
    this.buttonWidth = rect.width;
    this.buttonHeight = rect.height;

    // Get pointer coordinates
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragStartY = clientY;

    // Resolve initial position, defaulting to client boundaries if not set
    this.initialX = this.buttonX !== null ? this.buttonX : rect.left;
    this.initialY = this.buttonY !== null ? this.buttonY : rect.top;

    this.buttonX = this.initialX;
    this.buttonY = this.initialY;
    this.dragDistance = 0;
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(event: MouseEvent) {
    this.onDragMove(event);
  }

  @HostListener('window:touchmove', ['$event'])
  onWindowTouchMove(event: TouchEvent) {
    this.onDragMove(event);
  }

  @HostListener('window:mouseup', ['$event'])
  onWindowMouseUp(event: MouseEvent) {
    this.onDragEnd();
  }

  @HostListener('window:touchend', ['$event'])
  onWindowTouchEnd(event: TouchEvent) {
    this.onDragEnd();
  }

  private onDragMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const deltaX = clientX - this.dragStartX;
    const deltaY = clientY - this.dragStartY;

    this.dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

    this.dragStartX = clientX;
    this.dragStartY = clientY;

    if (this.buttonX !== null && this.buttonY !== null) {
      this.buttonX += deltaX;
      this.buttonY += deltaY;

      const margin = 16;
      const w = this.buttonWidth || 64;
      const h = this.buttonHeight || 64;

      if (this.buttonX < margin) this.buttonX = margin;
      if (this.buttonX > window.innerWidth - w - margin) {
        this.buttonX = window.innerWidth - w - margin;
      }

      if (this.buttonY < margin) this.buttonY = margin;
      if (this.buttonY > window.innerHeight - h - margin) {
        this.buttonY = window.innerHeight - h - margin;
      }
    }
  }

  private onDragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.dragDistance < 8) {
      this.openRequestDrawer();
    } else {
      // Save custom coordinates in percentages to handle different screen sizes / rotations
      if (this.buttonX !== null && this.buttonY !== null && typeof window !== 'undefined') {
        const xPercent = (this.buttonX / window.innerWidth) * 100;
        const yPercent = (this.buttonY / window.innerHeight) * 100;
        localStorage.setItem('bell_x_percent', xPercent.toString());
        localStorage.setItem('bell_y_percent', yPercent.toString());
      }
    }
  }

  showDrawer = false;

  isCartPage(): boolean {
    return this.router.url.includes('/cart');
  }

  isOrderInitPage(): boolean {
    return this.router.url.includes('/order-init');
  }

  isWaiterAllowed(): boolean {
    if (typeof localStorage !== 'undefined') {
      const type = localStorage.getItem('seating_type');
      return type !== 'ROOM' && type !== 'HOTEL_ROOM';
    }
    return true;
  }

  getTableNumber(): string {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('table_id') || 'N/A';
    }
    return 'N/A';
  }

  openRequestDrawer() {
    this.showDrawer = true;
  }

  closeRequestDrawer() {
    this.showDrawer = false;
  }

  toast: { message: string, type: 'success' | 'warning' | 'error' } | null = null;
  toastTimeout: any;

  showToast(message: string, type: 'success' | 'warning' | 'error') {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toast = { message, type };
    this.toastTimeout = setTimeout(() => {
      this.toast = null;
    }, 4000);
  }

  submitRequest(type: 'CALL_WAITER' | 'WATER' | 'BILL') {
    this.closeRequestDrawer();
    this.requestService.createRequest(type).subscribe({
      next: () => {
        if (type === 'BILL') {
          this.alertService.show('Bill Requested', 'Your invoice has been successfully generated! Redirecting you to complete payment.', 'success');
          this.router.navigate(['/orders']);
        } else {
          this.alertService.show('Request Received', 'Your request has been sent! A waiter is on their way to assist you.', 'success');
        }
      },
      error: (err) => {
        if (err.status === 409) {
          if (err.error === 'ALREADY_REQUESTED') {
            this.alertService.show('Pending Request', 'You have already placed this request for your table. Please wait for staff to assist you.', 'warning');
          } else if (err.error === 'NO_UNBILLED_ORDERS') {
            this.alertService.show('No Orders Found', 'You do not have any active unpaid orders to generate a bill for.', 'warning');
          } else {
            this.alertService.show('Request Pending', 'A pending request is already active for your table.', 'warning');
          }
        } else {
          console.error('Request failed:', err);
          this.alertService.show('Service Error', 'Failed to submit request. Please call our waitstaff manually.', 'error');
        }
      }
    });
  }
}
