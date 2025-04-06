import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.state';
import { selectCartState } from '../../state/cart/cart.selector';
import { AsyncPipe } from '@angular/common';
import { MenuFooterComponent } from '../menu-footer/menu-footer.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [MenuFooterComponent, AsyncPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent {
  private store = inject<Store<AppState>>(Store);
  public foodItem$ = this.store.select(selectCartState);
}
