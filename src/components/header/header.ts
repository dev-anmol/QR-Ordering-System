import { ChangeDetectionStrategy, Component, inject, signal, OnInit, DestroyRef, HostListener, ElementRef } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.state';
import { selectCartItemsCount } from '../../state/cart/cart.selector';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UicartService } from '../../shared/services/uicart/uicart.service';
import { NotificationService } from '../../services/notification.service';
import { OrderTrackingService } from '../../services/order-tracking.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, AsyncPipe, DatePipe, NgClass],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Header implements OnInit {
  public ui = inject(UicartService);
  public notificationService = inject(NotificationService);
  private orderTrackingService = inject(OrderTrackingService);
  private store = inject<Store<AppState>>(Store);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private eRef = inject(ElementRef);
  
  public cartCount$ = this.store.select(selectCartItemsCount);
  
  public isCartPage = signal(false);
  public isOrdersPage = signal(false);
  public showNotifications = signal(false);

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showNotifications.set(false);
    }
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications.update(v => !v);
    if (this.showNotifications()) {
      this.notificationService.markAllAsRead();
    }
  }

  ngOnInit() {
    this.updateRouteState(this.router.url);
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event: any) => {
      this.updateRouteState(event.urlAfterRedirects || event.url);
    });
  }

  private updateRouteState(url: string) {
    this.isCartPage.set(url.includes('/cart'));
    this.isOrdersPage.set(url.includes('/order'));
  }

  public getLastOrderId() {
    return localStorage.getItem('last_order_id');
  }
}

