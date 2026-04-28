import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
  effect
} from '@angular/core';

import { toSignal } from '@angular/core/rxjs-interop';

import { CommonModule } from '@angular/common';
import { FoodItemService } from '../../shared/services/foodItems/food-item.service';
import { FoodItem } from '../../shared/food-item/food-item';
import { foodInterface } from '../../model/food.interface';
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.state';
import { addToCart } from '../../state/cart/cart.actions';
import { Router } from '@angular/router';
import { UicartService } from '../../shared/services/uicart/uicart.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { first, Subscription, Subject, debounceTime } from 'rxjs';
import { CartService } from '../../services/cart/cart.service';


import { CustomerService } from '../../services/customer/customer.service';
import * as CartActions from '../../state/cart/cart.actions';
import { selectCartQuantityMap, selectCart } from '../../state/cart/cart.selector';
import { AddToCartRequest, UpdateCartItemRequest } from '../../model/cart.model';


@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [
    FoodItem,
    CommonModule
  ],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuPage implements OnInit, OnDestroy {

  private foodApi = inject(FoodItemService);
  private uiCart = inject(UicartService);
  private destroyRef = inject(DestroyRef);

  foodItem: WritableSignal<foodInterface[]> = signal<foodInterface[]>([]);
  isLoading: WritableSignal<boolean> = signal(true);
  hasError: WritableSignal<boolean> = signal(false);
  searchTerm: WritableSignal<string> = signal('');

  selectedProductForCustomization = signal<foodInterface | null>(null);
  selectedVariant = signal<string | null>(null);
  selectedAddons = signal<Set<string>>(new Set());

  categories = signal<any[]>([]);
  selectedCategoryId = signal<string | number | null>(null);
  private restaurantId = localStorage.getItem('restaurant_id') || '101';

  private store = inject<Store<AppState>>(Store);
  private router = inject(Router);

  // --- Optimistic UI & Debouncing ---
  private optimisticQuantities = signal<Record<string, number>>({});
  private quantitySync$ = new Subject<void>();
  public cartQuantityMap$ = this.store.select(selectCartQuantityMap);
  private storeQuantities = toSignal(this.cartQuantityMap$, { initialValue: {} as Record<string, number> });

  // Merged signal for UI
  public displayQuantityMap = computed(() => {
    return { ...this.storeQuantities(), ...this.optimisticQuantities() };
  });

  private menuCache: Record<string, foodInterface[]> = {};
  private fullMenu = signal<foodInterface[]>([]);


  constructor() {
    // Handle debounced sync
    this.quantitySync$.pipe(
      debounceTime(500),
      takeUntilDestroyed()
    ).subscribe(() => this.performSync());
  }

  ngOnInit() {
    this.uiCart.setShowCart(true);
    this.loadCategories();
    this.loadCart();
  }

  loadCart() {
    const sessionId = this.customerService.getSessionToken();
    const tableId = localStorage.getItem('table_id');
    const tableNumber = tableId ? parseInt(tableId) : 1;
    if (sessionId && this.restaurantId) {
      this.cartService.getCart(parseInt(this.restaurantId), sessionId, tableNumber).subscribe({
        next: (cart) => {
          this.store.dispatch(CartActions.loadCartSuccess({ cart }));
        },
        error: (err) => console.error('Error loading cart:', err)
      });
    }
  }

  loadCategories() {
    if (!this.restaurantId) return;
    this.foodApi.getCategories(this.restaurantId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.categories.set(data);
        if (data.length > 0) {
          const firstCatId = data[0].categoryId;
          this.selectedCategoryId.set(firstCatId);
          this.loadFoodItems(firstCatId);
        }
      },
      error: (err) => console.error('Error fetching categories:', err)
    });
  }

  loadFoodItems(categoryId: string | number | null) {
    if (!this.restaurantId || !categoryId) return;

    // Check cache for optimization
    const cacheKey = categoryId.toString();
    if (this.menuCache[cacheKey]) {
      this.fullMenu.set(this.menuCache[cacheKey]);
      return;
    }

    this.isLoading.set(true);
    this.foodApi.getFoodItems(this.restaurantId, categoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.menuCache[cacheKey] = data;
          this.fullMenu.set(data);
          this.isLoading.set(false);
          this.hasError.set(false);
        },
        error: (err) => {
          console.error('Error fetching food items:', err);
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });
  }

  selectCategory(id: string | number) {
    this.selectedCategoryId.set(id);
    this.loadFoodItems(id);
  }

  filteredFoodItems = computed<foodInterface[]>(() => {
    const term = this.searchTerm().toLowerCase();
    const menu = this.fullMenu();
    
    if (!menu.length) return [];

    return menu.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(term);
      return matchesSearch && item.enabled;
    });
  });



  searchMenu(event: any) {
    this.searchTerm.set(event.target.value.toLowerCase());
  }

  private cartService = inject(CartService);
  private customerService = inject(CustomerService);

  openCustomizationModal(product: foodInterface) {
    this.selectedProductForCustomization.set(product);
    if (product.variants && product.variants.length > 0) {
      this.selectedVariant.set(product.variants[0].variantId); // Auto-select first option
    } else {
      this.selectedVariant.set(null);
    }
    this.selectedAddons.set(new Set());
  }

  closeCustomizationModal() {
    this.selectedProductForCustomization.set(null);
  }

  toggleAddon(addonId: string) {
    const current = new Set(this.selectedAddons());
    if (current.has(addonId)) {
      current.delete(addonId);
    } else {
      current.add(addonId);
    }
    this.selectedAddons.set(current);
  }

  confirmAddToCart() {
    const product = this.selectedProductForCustomization();
    if (!product) return;
    this.executeAddToCart(product, this.selectedVariant() || undefined, Array.from(this.selectedAddons()));
    this.closeCustomizationModal();
  }

  addItemToCart(product: foodInterface) {
    if ((product.variants && product.variants.length > 0) || (product.addons && product.addons.length > 0)) {
      this.openCustomizationModal(product);
    } else {
      const currentQty = this.displayQuantityMap()[product.id] || 0;
      this.optimisticQuantities.update(prev => ({ ...prev, [product.id]: currentQty + 1 }));
      this.quantitySync$.next();
    }
  }

  removeFromCart(product: foodInterface) {
    const currentQty = this.displayQuantityMap()[product.id] || 0;
    if (currentQty <= 0) return;

    this.optimisticQuantities.update(prev => ({ ...prev, [product.id]: currentQty - 1 }));
    this.quantitySync$.next();
  }

  private performSync() {
    const optimistic = this.optimisticQuantities();
    const store = this.storeQuantities();
    const sessionId = this.customerService.getSessionToken();
    if (!sessionId || !this.restaurantId) return;

    // We sync each item that has a different quantity in optimistic vs store
    Object.keys(optimistic).forEach(productId => {
      const targetQty = optimistic[productId];
      const storeQty = store[productId] || 0;

      if (targetQty === storeQty) return;

      if (targetQty > storeQty) {
        // Increase: use addItem with delta
        const delta = targetQty - storeQty;
        // We need the full product object. Let's find it in our current list.
        const product = this.fullMenu().find(p => p.id === productId);
        if (product) {
          this.executeAddToCart(product, undefined, [], delta);
        }

      } else {
        // Decrease: use updateItemQuantity or removeItem
        this.store.select(selectCart).pipe(first()).subscribe(cart => {
          if (!cart) return;
          const item = cart.items.find(i => i.menuItemId === productId);
          if (item) {
            if (targetQty > 0) {
              this.cartService.updateItemQuantity(item.cartItemId, {
                restaurantId: parseInt(this.restaurantId!),
                sessionId: sessionId,
                quantity: targetQty
              }).subscribe(updatedCart => {
                this.store.dispatch(CartActions.loadCartSuccess({ cart: updatedCart }));
                this.clearOptimisticIfMatched(productId, targetQty);
              });
            } else {
              this.cartService.removeItem(item.cartItemId, parseInt(this.restaurantId!), sessionId).subscribe(updatedCart => {
                this.store.dispatch(CartActions.loadCartSuccess({ cart: updatedCart }));
                this.clearOptimisticIfMatched(productId, 0);
              });
            }
          }
        });
      }
    });
  }

  private clearOptimisticIfMatched(productId: string, targetQty: number) {
    // If the optimistic value is still what we just synced, we can clear it
    // If the user clicked more while we were syncing, we keep the new optimistic value
    if (this.optimisticQuantities()[productId] === targetQty) {
      this.optimisticQuantities.update(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
  }

  executeAddToCart(product: foodInterface, variantId?: string, addonIds: string[] = [], delta: number = 1) {
    const sessionId = this.customerService.getSessionToken();
    if (!sessionId) {
      alert('Your session has expired. Please scan the QR code again.');
      return;
    }

    const request: AddToCartRequest = {
      sessionId: sessionId,
      restaurantId: parseInt(this.restaurantId!),
      imageUrl: product.image,
      menuItemId: product.id,
      quantity: delta,
      addonIds: addonIds,
      variantId: variantId
    };

    this.cartService.addItem(request).subscribe({
      next: (cart) => {
        this.store.dispatch(CartActions.loadCartSuccess({ cart }));
        this.clearOptimisticIfMatched(product.id, (this.storeQuantities()[product.id] || 0) + delta);
      },
      error: (err) => {
        console.error('Error syncing cart:', err);
        // On error, we might want to revert the optimistic state
        this.optimisticQuantities.update(prev => {
          const next = { ...prev };
          delete next[product.id];
          return next;
        });
      }
    });
  }


  ngOnDestroy() {
    this.uiCart.setShowCart(false);
  }
}
