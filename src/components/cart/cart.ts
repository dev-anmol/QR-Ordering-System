import { Component, inject, OnInit, signal, WritableSignal, computed, DestroyRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.state';
import { selectCart } from '../../state/cart/cart.selector';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart/cart.service';
import { CustomerService } from '../../services/customer/customer.service';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, first } from 'rxjs';
import { GoogleAnalyticsService } from '../../services/google-analytics.service';

import * as CartActions from '../../state/cart/cart.actions';
import { Router, RouterModule } from '@angular/router';

import { InstallBannerComponent } from '../install-banner/install-banner.component';
import { OrderTrackingService } from '../../services/order-tracking.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, InstallBannerComponent],
  templateUrl: './cart.html',

  styleUrl: './cart.css'
})
export class Cart implements OnInit {
  private store = inject<Store<AppState>>(Store);
  private cartService = inject(CartService);
  private customerService = inject(CustomerService);
  private destroyRef = inject(DestroyRef);
  private orderTrackingService = inject(OrderTrackingService);
  private analyticsService = inject(GoogleAnalyticsService);

  public isCheckingOut = signal(false);
  public error = signal<string | null>(null);
  public showNameModal = signal(false);
  public showHotelModal = signal(false);
  public userName = signal(localStorage.getItem('user_name') || '');
  public hotelMobile = signal(localStorage.getItem('hotel_mobile') || '');
  public hotelRoom = signal(localStorage.getItem('hotel_room') || '');
  public hotelFloor = signal(localStorage.getItem('hotel_floor') || '');

  private router = inject(Router);

  public cart$ = this.store.select(selectCart);
  private rawCart = toSignal(this.cart$);
  public foodItemLength: WritableSignal<any> = signal(0);
  public tableId = localStorage.getItem('table_id');
  public seatingType = localStorage.getItem('seating_type') || 'TABLE';
  public seatingLabel = (this.seatingType === 'ROOM' || this.seatingType === 'HOTEL_ROOM') ? 'Room' : 'Table';
  private restaurantId = localStorage.getItem('restaurant_id') || '101';
  
  public gstRate = 0.05; // 5% GST for restaurants

  // --- Optimistic UI & Debouncing ---
  private optimisticQuantities = signal<Record<string, number>>({});
  private quantitySync$ = new Subject<void>();

  public displayCart = computed(() => {
    const cart = this.rawCart();
    if (!cart) return null;

    const optimistic = this.optimisticQuantities();
    
    // Determine the actual GST rate from the backend's latest cart data
    let actualGstRate = this.gstRate;
    if (cart.subtotal > 0 && cart.gstPrice !== undefined) {
      actualGstRate = cart.gstPrice / cart.subtotal;
    }

    const updatedItems = cart.items.map(item => {
      let qty = item.quantity;
      if (optimistic[item.cartItemId] !== undefined) {
        qty = optimistic[item.cartItemId];
      }
      const totalPrice = item.unitPrice * qty;
      const gstPrice = totalPrice * actualGstRate;
      return { ...item, quantity: qty, totalPrice, gstPrice };
    }).filter(item => item.quantity > 0);

    const subtotal = updatedItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const gstPrice = subtotal * actualGstRate;

    return {
      ...cart,
      items: updatedItems,
      subtotal: subtotal,
      gstPrice: gstPrice
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
          this.store.dispatch(CartActions.loadCartSuccess({ cart }));
        },
        error: (err) => {
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
    const hotelConfigId = localStorage.getItem('hotel_config_id') || '';

    if (sessionId && this.restaurantId && !this.isCheckingOut()) {
      const currentName = this.userName().trim();

      if (this.seatingType === 'HOTEL_ROOM') {
        const currentMobile = this.hotelMobile().trim();
        const currentRoom = this.hotelRoom().trim();
        if (!currentName || currentMobile.length !== 10 || !currentRoom) {
          this.showHotelModal.set(true);
          return;
        }
      } else {
        if (!currentName) {
          this.showNameModal.set(true);
          return;
        }
      }

      this.isCheckingOut.set(true);

      const checkoutPayload: any = {
        restaurantId: parseInt(this.restaurantId),
        sessionId: sessionId,
        tableNumber: this.seatingType === 'HOTEL_ROOM' ? 0 : tableNumber,
        seatingType: this.seatingType,
        userName: currentName,
        items: this.rawCart()?.items.map(item => ({
          menuItemId: item.menuItemId,
          variantId: item.variant?.variantId,
          quantity: item.quantity
        }))
      };

      if (this.seatingType === 'HOTEL_ROOM') {
        const currentMobile = this.hotelMobile().trim();
        const currentRoom = this.hotelRoom().trim();
        checkoutPayload.hotelConfigId = hotelConfigId;
        checkoutPayload.mobileNumber = currentMobile;
        // Do not append "(Floor X)" as it breaks backend exact-match validation
        checkoutPayload.roomNumber = currentRoom;
      }

      this.cartService.checkout(checkoutPayload).subscribe({
        next: (res) => {
          this.analyticsService.trackEvent('order_placed', {
            order_id: res.orderId,
            total_amount: res.totalAmount
          });

          this.isCheckingOut.set(false);
          this.error.set(null); // Clear any previous errors

          // Save to localStorage only on success
          const currentName = this.userName().trim();
          localStorage.setItem('user_name', currentName);
          if (this.seatingType === 'HOTEL_ROOM') {
            const currentMobile = this.hotelMobile().trim();
            const currentRoom = this.hotelRoom().trim();
            const currentFloor = this.hotelFloor().trim();
            localStorage.setItem('hotel_mobile', currentMobile);
            localStorage.setItem('hotel_room', currentRoom);
            if (currentFloor) {
              localStorage.setItem('hotel_floor', currentFloor);
            } else {
              localStorage.removeItem('hotel_floor');
            }
          }
          
          this.showHotelModal.set(false);
          this.showNameModal.set(false);

          localStorage.setItem('last_order_id', res.orderId);
          this.store.dispatch(CartActions.loadCartSuccess({ cart: null as any }));
          
          // Start tracking the order immediately so notifications work on other pages/in background
          this.orderTrackingService.startTracking(res.orderId, res);
          
          // Navigate directly to the live order tracking details page
          this.router.navigate(['/order', res.orderId]);
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
      this.checkout(); // Proceed with checkout, will set localStorage on success
    }
  }

  onMobileInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.hotelMobile.set(value.replace(/\D/g, '').slice(0, 10)); // numbers only, max 10 digits
  }

  onRoomInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.hotelRoom.set(value.slice(0, 10)); // max 10 chars
  }

  onFloorInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.hotelFloor.set(value.slice(0, 5)); // max 5 chars
  }

  confirmHotelDetails() {
    const name = this.userName().trim();
    const mobile = this.hotelMobile().trim();
    const room = this.hotelRoom().trim();

    if (name.length >= 2 && mobile.length === 10 && room.length >= 1) {
      this.checkout(); // Proceed with checkout, will set localStorage on success
    }
  }

  private getFriendlyErrorMessage(err: any): string {
    const errorMsg = err.error?.message || (typeof err.error === 'string' ? err.error : '');
    
    if (errorMsg.includes('Please check your room number') || (errorMsg.toLowerCase().includes('not found in') && errorMsg.toLowerCase().includes('room'))) {
      return 'The room number you entered is not valid for this hotel. Please check and try again.';
    }
    if (errorMsg.includes('java.lang.Exception') && errorMsg.toLowerCase().includes('room')) {
      return 'The room number you entered is not valid. Please check and try again.';
    }
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
