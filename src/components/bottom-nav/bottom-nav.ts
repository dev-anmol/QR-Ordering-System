import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.state';
import { selectCart } from '../../state/cart/cart.selector';
import { map } from 'rxjs';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-nav.html',
  styles: [`
    .nav-active {
      color: #000000 !important;
      transform: scale(1.1);
    }
    .nav-active i {
      color: #facc15 !important;
    }
    .nav-active span {
      font-weight: 900;
      color: #facc15 !important;
    }
  `]
})
export class BottomNav {
  private store = inject(Store);
  private router = inject(Router);

  cartItemCount$ = this.store.select(selectCart).pipe(
    map(cart => cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0)
  );

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
