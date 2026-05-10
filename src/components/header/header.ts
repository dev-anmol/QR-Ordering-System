import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.state';
import { selectCartItemsCount } from '../../state/cart/cart.selector';
import { AsyncPipe } from '@angular/common';

import { UicartService } from '../../shared/services/uicart/uicart.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Header {
  public ui = inject(UicartService);
  private store = inject<Store<AppState>>(Store);
  private router = inject(Router);
  public cartCount$ = this.store.select(selectCartItemsCount);

  public getLastOrderId() {
    return localStorage.getItem('last_order_id');
  }

  public isCartPage(): boolean {
    return this.router.url.includes('/cart');
  }
}

