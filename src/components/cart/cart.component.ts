import {Component, inject, signal, WritableSignal} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../state/app.state';
import {selectCartState} from '../../state/cart/cart.selector';
import {AsyncPipe} from '@angular/common';
import {MenuFooterComponent} from '../menu-footer/menu-footer.component';
import {foodInterface} from '../../model/food.interface';
import {removeItem} from '../../state/cart/cart.actions';

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
  public foodItemLength: WritableSignal<any> = signal(0)

  removeItem(product: foodInterface) {
    if (product.id !== undefined) {
      this.store.dispatch(removeItem({productId: product.id}));
    } else {
      console.error('Product ID is undefined');
    }
  }


}
