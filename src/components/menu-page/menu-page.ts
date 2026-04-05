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
import { first, Subscription } from 'rxjs';
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

  constructor() {
    // Re-fetch items whenever category changes
    effect(() => {
      const catId = this.selectedCategoryId();
      this.loadFoodItems(catId);
    }, { allowSignalWrites: true });
  }
 
  public cartQuantityMap$ = this.store.select(selectCartQuantityMap);

  ngOnInit() {
    console.log('MenuPage Debug: restaurantId from storage:', localStorage.getItem('restaurant_id'));
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
        if (data.length > 0 && !this.selectedCategoryId()) {
          this.selectedCategoryId.set(data[0].categoryId);
        }
      },
      error: (err) => console.error('Error fetching categories:', err)
    });
  }

  private foodListSub?: Subscription;

  loadFoodItems(categoryId: string | number | null) {
    this.isLoading.set(true);

    // Cancel the previous API request so they don't get mixed up!
    if (this.foodListSub) {
      this.foodListSub.unsubscribe();
    }

    if (!this.restaurantId) return;
    this.foodListSub = this.foodApi.getFoodItems(this.restaurantId, categoryId || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.foodItem.set(data);
          this.isLoading.set(false);
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
  }

  filteredFoodItems = computed<foodInterface[]>(() =>
    this.foodItem().filter(item =>
      item.name.toLowerCase().includes(this.searchTerm())
    )
  )

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
      this.executeAddToCart(product);
    }
  }

  executeAddToCart(product: foodInterface, variantId?: string, addonIds: string[] = []) {
    const sessionId = this.customerService.getSessionToken();
    console.log('Attempting to add to cart. SessionId:', sessionId, 'Product:', product.name);

    if (!sessionId) {
      alert('Your session has expired or you haven\'t scanned a QR code. Please scan the QR code again.');
      console.error('No session token found. Please scan QR code again.');
      return;
    }

    const request: AddToCartRequest = {
      sessionId: sessionId,
      restaurantId: parseInt(this.restaurantId!),
      imageUrl: product.image,
      menuItemId: product.id,
      quantity: 1,
      addonIds: addonIds,
      variantId: variantId
    };

    this.cartService.addItem(request).subscribe({
      next: (cart) => {
        console.log('Item added successfully. Updated cart:', cart);
        this.store.dispatch(CartActions.loadCartSuccess({ cart }));
      },
      error: (err) => {
        console.error('Error adding item to cart:', err);
        alert('Could not add item to cart. Please try again later.');
      }
    });
  }

  removeFromCart(product: foodInterface) {
    const sessionId = this.customerService.getSessionToken();
    if (!sessionId) return;

    // We need to find the cart item that matches this menu item
    this.store.select(selectCart).pipe(first()).subscribe(cart => {
      if (!cart) return;

      const item = cart.items.find(i => i.menuItemId === product.id);
      if (item) {
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

  ngOnDestroy() {
    this.uiCart.setShowCart(false);
  }
}
