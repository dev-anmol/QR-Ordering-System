import { ChangeDetectionStrategy, Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.state';
import { selectCartItemsCount } from '../../state/cart/cart.selector';
import { AsyncPipe } from '@angular/common';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UicartService } from '../../shared/services/uicart/uicart.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Header implements OnInit {
  public ui = inject(UicartService);
  private store = inject<Store<AppState>>(Store);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  
  public cartCount$ = this.store.select(selectCartItemsCount);
  
  public isCartPage = signal(false);
  public isOrdersPage = signal(false);

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

