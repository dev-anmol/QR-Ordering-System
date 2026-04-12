import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.state';
import { selectCart } from '../../state/cart/cart.selector';
import { AsyncPipe, CommonModule } from '@angular/common';
import { CartService } from '../../services/cart/cart.service';
import { CustomerService } from '../../services/customer/customer.service';

import * as CartActions from '../../state/cart/cart.actions';
import { Router, RouterModule } from '@angular/router';
import { first } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [AsyncPipe, CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit {
  private store = inject<Store<AppState>>(Store);
  private cartService = inject(CartService);
  private customerService = inject(CustomerService);

  public isCheckingOut = signal(false);
  private router = inject(Router);

  public cart$ = this.store.select(selectCart);
  public foodItemLength: WritableSignal<any> = signal(0);
  public tableId = localStorage.getItem('table_id');
  private restaurantId = localStorage.getItem('restaurant_id') || '101';
  
  public gstRate = 0.05; // 5% GST for restaurants



  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    const sessionId = this.customerService.getSessionToken();
    const tableNumber = this.tableId ? parseInt(this.tableId) : 1;
    if (sessionId && this.restaurantId) {
      this.cartService.getCart(parseInt(this.restaurantId), sessionId, tableNumber).subscribe({
        next: (cart) => {
          console.log('Cart loaded successfully:', cart);
          this.store.dispatch(CartActions.loadCartSuccess({ cart }));
        },
        error: (err) => {
          console.error('Error loading cart:', err);
          alert('Failed to load cart. Ensure Cart Service is running.');
        }
      });
    }
  }



  updateQuantity(item: any, delta: number) {
    const sessionId = this.customerService.getSessionToken();
    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      this.removeItem(item);
      return;
    }

    if (sessionId && item.cartItemId && this.restaurantId) {
      this.cartService.updateItemQuantity(item.cartItemId, {
        restaurantId: parseInt(this.restaurantId),
        sessionId: sessionId,
        quantity: newQuantity
      }).subscribe({
        next: (cart) => {
          console.log('Quantity updated successfully:', cart);
          this.store.dispatch(CartActions.loadCartSuccess({ cart }));
        },
        error: (err) => {
          console.error('Error updating quantity:', err);
          alert('Failed to update quantity.');
        }
      });
    }
  }

  removeItem(item: any) {
    const sessionId = this.customerService.getSessionToken();
    if (sessionId && item.cartItemId && this.restaurantId) {
      this.cartService.removeItem(item.cartItemId, parseInt(this.restaurantId), sessionId).subscribe({
        next: (cart) => {
          console.log('Item removed successfully. Updated cart:', cart);
          this.store.dispatch(CartActions.loadCartSuccess({ cart }));
        },
        error: (err) => {
          console.error('Error removing item:', err);
          alert('Failed to remove item.');
        }
      });
    }
  }

  checkout() {
    const sessionId = this.customerService.getSessionToken();
    const tableId = localStorage.getItem('table_id');
    const tableNumber = tableId ? parseInt(tableId) : 1;

    if (sessionId && this.restaurantId && !this.isCheckingOut()) {
      this.isCheckingOut.set(true);
      this.cartService.checkout({
        restaurantId: parseInt(this.restaurantId),
        sessionId: sessionId,
        tableNumber: tableNumber,
        variantId: ""
      }).subscribe({
        next: (res) => {
          this.isCheckingOut.set(false);
          localStorage.setItem('last_order_id', res.orderId);
          this.store.dispatch(CartActions.loadCartSuccess({ cart: null as any }));
          // Navigate to the full orders list since downstream processing takes time
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          this.isCheckingOut.set(false);
          console.error('Checkout failed:', err);
          alert('Failed to place order. Please try again.');
        }
      });
    }
  }

  calculateTax(subtotal: number = 0): number {
    return subtotal * this.gstRate;
  }

  calculateGrandTotal(subtotal: number = 0): number {
    return subtotal + this.calculateTax(subtotal);
  }
}
