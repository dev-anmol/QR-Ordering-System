import { Component, inject, OnInit, signal, WritableSignal, computed, DestroyRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.state';
import { selectCart } from '../../state/cart/cart.selector';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart/cart.service';
import { CustomerService } from '../../services/customer/customer.service';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, first } from 'rxjs';

import * as CartActions from '../../state/cart/cart.actions';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',

  styleUrl: './cart.css'
})
export class Cart implements OnInit {
  private store = inject<Store<AppState>>(Store);
  private cartService = inject(CartService);
  private customerService = inject(CustomerService);
  private destroyRef = inject(DestroyRef);

  public isCheckingOut = signal(false);
  public error = signal<string | null>(null);
  public showNameModal = signal(false);
  public userName = signal(localStorage.getItem('user_name') || '');

  private router = inject(Router);

  public cart$ = this.store.select(selectCart);
  private rawCart = toSignal(this.cart$);
  public foodItemLength: WritableSignal<any> = signal(0);
  public tableId = localStorage.getItem('table_id');
  private restaurantId = localStorage.getItem('restaurant_id') || '101';
  
  public gstRate = 0.05; // 5% GST for restaurants

  // --- Optimistic UI & Debouncing ---
  private optimisticQuantities = signal<Record<string, number>>({});
  private quantitySync$ = new Subject<void>();

  public displayCart = computed(() => {
    const cart = this.rawCart();
    if (!cart) return null;

    const optimistic = this.optimisticQuantities();
    const updatedItems = cart.items.map(item => {
      if (optimistic[item.cartItemId] !== undefined) {
        return { ...item, quantity: optimistic[item.cartItemId] };
      }
      return item;
    }).filter(item => item.quantity > 0);

    const subtotal = updatedItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

    return {
      ...cart,
      items: updatedItems,
      subtotal: subtotal
    };
  });

  constructor() {
    this.quantitySync$.pipe(
      debounceTime(500),
      takeUntilDestroyed()
    ).subscribe(() => this.performSync());
  }




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
          this.error.set(err.error?.message || 'Failed to load cart. Ensure Cart Service is running.');
        }
      });
    }
  }



  updateQuantity(item: any, delta: number) {
    const currentQty = this.optimisticQuantities()[item.cartItemId] !== undefined 
      ? this.optimisticQuantities()[item.cartItemId] 
      : item.quantity;
    
    const newQty = currentQty + delta;
    this.optimisticQuantities.update(prev => ({ ...prev, [item.cartItemId]: newQty }));
    this.quantitySync$.next();
  }

  onNameInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.userName.set(value.slice(0, 15));
  }

  private performSync() {
    const optimistic = this.optimisticQuantities();
    const cart = this.rawCart();
    const sessionId = this.customerService.getSessionToken();

    if (!cart || !sessionId || !this.restaurantId) return;

    Object.keys(optimistic).forEach(cartItemId => {
      const targetQty = optimistic[cartItemId];
      const originalItem = cart.items.find(i => i.cartItemId === cartItemId);
      
      if (!originalItem || originalItem.quantity === targetQty) return;

      if (targetQty > 0) {
        this.cartService.updateItemQuantity(cartItemId, {
          restaurantId: parseInt(this.restaurantId!),
          sessionId: sessionId,
          quantity: targetQty
        }).subscribe({
          next: (updatedCart) => {
            this.store.dispatch(CartActions.loadCartSuccess({ cart: updatedCart }));
            this.clearOptimisticIfMatched(cartItemId, targetQty);
          },
          error: (err) => {
            console.error('Error syncing quantity:', err);
            this.optimisticQuantities.update(prev => {
              const next = { ...prev };
              delete next[cartItemId];
              return next;
            });
          }
        });
      } else {
        this.cartService.removeItem(cartItemId, parseInt(this.restaurantId!), sessionId).subscribe({
          next: (updatedCart) => {
            this.store.dispatch(CartActions.loadCartSuccess({ cart: updatedCart }));
            this.clearOptimisticIfMatched(cartItemId, 0);
          },
          error: (err) => {
            console.error('Error removing item:', err);
            this.optimisticQuantities.update(prev => {
              const next = { ...prev };
              delete next[cartItemId];
              return next;
            });
          }
        });
      }
    });
  }

  private clearOptimisticIfMatched(cartItemId: string, targetQty: number) {
    if (this.optimisticQuantities()[cartItemId] === targetQty) {
      this.optimisticQuantities.update(prev => {
        const next = { ...prev };
        delete next[cartItemId];
        return next;
      });
    }
  }

  removeItem(item: any) {
    const sessionId = this.customerService.getSessionToken();
    if (sessionId && item.cartItemId && this.restaurantId) {
      this.cartService.removeItem(item.cartItemId, parseInt(this.restaurantId), sessionId).subscribe({
        next: (cart) => {
          this.store.dispatch(CartActions.loadCartSuccess({ cart }));
        },
        error: (err) => {
          console.error('Error removing item:', err);
          this.error.set(err.error?.message || 'Failed to remove item.');
        }
      });
    }
  }


  checkout() {
    const sessionId = this.customerService.getSessionToken();
    const tableId = localStorage.getItem('table_id');
    const tableNumber = tableId ? parseInt(tableId) : 1;

    if (sessionId && this.restaurantId && !this.isCheckingOut()) {
      // 1. Check if name exists
      const storedName = localStorage.getItem('user_name');
      if (!storedName) {
        this.showNameModal.set(true);
        return;
      }

      this.isCheckingOut.set(true);
      this.cartService.checkout({
        restaurantId: parseInt(this.restaurantId),
        sessionId: sessionId,
        tableNumber: tableNumber,
        userName: storedName,
        items: this.rawCart()?.items.map(item => ({
          menuItemId: item.menuItemId,
          variantId: item.variant?.variantId,
          quantity: item.quantity
        }))
      }).subscribe({
        next: (res) => {
          this.isCheckingOut.set(false);
          this.error.set(null); // Clear any previous errors
          localStorage.setItem('last_order_id', res.orderId);
          this.store.dispatch(CartActions.loadCartSuccess({ cart: null as any }));
          // Navigate to the full orders list since downstream processing takes time
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          this.isCheckingOut.set(false);
          console.error('Checkout failed:', err);
          const friendlyMsg = this.getFriendlyErrorMessage(err);
          this.error.set(friendlyMsg);
          // Scroll to top to see the error
          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  confirmName() {
    const name = this.userName().trim();
    if (name.length >= 2) {
      localStorage.setItem('user_name', name);
      this.showNameModal.set(false);
      this.checkout(); // Proceed with checkout
    }
  }

  private getFriendlyErrorMessage(err: any): string {
    const errorMsg = err.error?.message || '';
    
    if (errorMsg.includes('INSUFFICIENT_STOCK')) {
      return 'Oops! Some items in your cart just ran out of stock. Please check availability.';
    }
    if (errorMsg.includes('ITEM_NOT_FOUND')) {
      return 'One of the items in your cart is no longer available. Please remove it to proceed.';
    }
    if (errorMsg.includes('ITEM_DISABLED')) {
      return 'One of your items is currently not being served. Please check back later.';
    }
    if (errorMsg.includes('Cart empty')) {
      return 'Your cart is empty. Please add some delicious food first!';
    }
    if (err.status === 0) {
      return 'Connection error. Please check your internet and try again.';
    }
    
    return err.error?.message || 'Something went wrong while placing your order. Please try again.';
  }

  calculateTax(subtotal: number = 0): number {
    return subtotal * this.gstRate;
  }

  calculateGrandTotal(subtotal: number = 0): number {
    return subtotal + this.calculateTax(subtotal);
  }
}
