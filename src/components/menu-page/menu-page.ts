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
import { AddToCartRequest, UpdateCartItemRequest, CartItemDto } from '../../model/cart.model';


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
  showCategoryMenu = signal(false);
  private restaurantId = localStorage.getItem('restaurant_id') || '101';

  private store = inject<Store<AppState>>(Store);
  private router = inject(Router);

  public cartQuantityMap$ = this.store.select(selectCartQuantityMap);
  private storeQuantities = toSignal(this.cartQuantityMap$, { initialValue: {} as Record<string, number> });

  // --- Basket Management ---
  basket = signal<CartItemDto[]>([]);

  // Total items in basket
  basketTotalCount = computed(() => {
    return this.basket().reduce((acc: number, item: CartItemDto) => acc + item.quantity, 0);
  });

  // Total price in basket
  basketTotalPrice = computed(() => {
    let total = 0;
    this.basket().forEach((item: CartItemDto) => {
      const product = this.fullMenu().find(p => p.id === item.menuItemId);
      if (product) {
        let itemPrice = product.price;
        if (item.variantId && product.variants) {
          const variant = product.variants.find(v => v.variantId === item.variantId);
          if (variant) itemPrice += variant.price;
        }
        if (item.addonIds && product.addons) {
          item.addonIds.forEach(id => {
            const addon = product.addons?.find(a => a.addonId === id);
            if (addon) itemPrice += addon.price;
          });
        }
        total += itemPrice * item.quantity;
      }
    });
    return total;
  });

  // Merged signal for UI quantities
  public displayQuantityMap = computed(() => {
    const store = this.storeQuantities();
    const basketMap: Record<string, number> = {};
    this.basket().forEach((item: CartItemDto) => {
      basketMap[item.menuItemId] = (basketMap[item.menuItemId] || 0) + item.quantity;
    });

    const merged = { ...store };
    Object.keys(basketMap).forEach(id => {
      merged[id] = (merged[id] || 0) + basketMap[id];
    });
    return merged;
  });

  private menuCache: Record<string, foodInterface[]> = {};
  private fullMenu = signal<foodInterface[]>([]);


  constructor() { }

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
    this.addToBasket(product, this.selectedVariant() || undefined, Array.from(this.selectedAddons()));
    this.closeCustomizationModal();
  }

  addItemToCart(product: foodInterface) {
    if ((product.variants && product.variants.length > 0) || (product.addons && product.addons.length > 0)) {
      this.openCustomizationModal(product);
    } else {
      this.addToBasket(product);
    }
  }

  private addToBasket(product: foodInterface, variantId?: string, addonIds: string[] = [], quantity: number = 1) {
    this.basket.update(prev => {
      const existingIndex = prev.findIndex(item =>
        item.menuItemId === product.id &&
        item.variantId === variantId &&
        JSON.stringify([...(item.addonIds || [])].sort()) === JSON.stringify([...(addonIds || [])].sort())
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + quantity };
        return next;
      } else {
        const newItem: CartItemDto = {
          imageUrl: product.image,
          menuItemId: product.id,
          quantity: quantity,
          addonIds: addonIds,
          variantId: variantId
        };
        return [...prev, newItem];
      }
    });
  }

  removeFromCart(product: foodInterface) {
    // 1. Try to remove from basket first (most recent addition)
    const basketIndex = this.basket().findLastIndex((item: CartItemDto) => item.menuItemId === product.id);

    if (basketIndex > -1) {
      this.basket.update(prev => {
        const next = [...prev];
        if (next[basketIndex].quantity > 1) {
          next[basketIndex] = { ...next[basketIndex], quantity: next[basketIndex].quantity - 1 };
        } else {
          next.splice(basketIndex, 1);
        }
        return next;
      });
    } else {
      // 2. If not in basket, decrease from cart directly (immediate sync for removal from cart)
      this.store.select(selectCart).pipe(first()).subscribe(cart => {
        if (!cart) return;
        const item = cart.items.find(i => i.menuItemId === product.id);
        if (item) {
          const sessionId = this.customerService.getSessionToken();
          if (!sessionId || !this.restaurantId) return;

          if (item.quantity > 1) {
            this.cartService.updateItemQuantity(item.cartItemId, {
              restaurantId: parseInt(this.restaurantId!),
              sessionId: sessionId,
              quantity: item.quantity - 1
            }).subscribe(updatedCart => {
              this.store.dispatch(CartActions.loadCartSuccess({ cart: updatedCart }));
            });
          } else {
            this.cartService.removeItem(item.cartItemId, parseInt(this.restaurantId!), sessionId).subscribe(updatedCart => {
              this.store.dispatch(CartActions.loadCartSuccess({ cart: updatedCart }));
            });
          }
        }
      });
    }
  }

  isSyncing = signal(false);

  addBasketToCart() {
    const basketItems = this.basket();
    if (basketItems.length === 0 || this.isSyncing()) return;

    this.isSyncing.set(true);

    const sessionId = this.customerService.getSessionToken() || '';
    const tableId = localStorage.getItem('table_id');
    const tableNumber = tableId ? parseInt(tableId) : 1;

    const request: AddToCartRequest = {
      sessionId: sessionId,
      restaurantId: parseInt(this.restaurantId!),
      tableNumber: tableNumber,
      items: basketItems
    };

    this.cartService.addItem(request).subscribe({
      next: (cart) => {
        this.store.dispatch(CartActions.loadCartSuccess({ cart }));
        this.basket.set([]);
        this.isSyncing.set(false);
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        console.error('Error adding items from basket:', err);
        this.isSyncing.set(false);
      }
    });
  }



  ngOnDestroy() {
    this.uiCart.setShowCart(false);
  }

  toggleCategoryMenu() {
    this.showCategoryMenu.update(v => !v);
  }

  scrollToCategory(categoryId: string | number) {
    this.selectCategory(categoryId);
    this.showCategoryMenu.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
