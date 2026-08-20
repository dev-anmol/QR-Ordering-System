import { createAction, props } from '@ngrx/store';
import { foodInterface } from '../../model/food.interface';
import { AddToCartRequest, Cart, UpdateCartItemRequest } from '../../model/cart.model';

// Backend Cart Actions
export const loadCart = createAction(
  '[Cart] Load Cart',
  props<{ restaurantId: number; sessionId: string }>()
);

export const loadCartSuccess = createAction(
  '[Cart] Load Cart Success',
  props<{ cart: Cart }>()
);

export const loadCartFailure = createAction(
  '[Cart] Load Cart Failure',
  props<{ error: any }>()
);

export const addToCartAPI = createAction(
  '[Cart] Add To Cart API',
  props<{ request: AddToCartRequest }>()
);

export const updateCartItemAPI = createAction(
  '[Cart] Update Cart Item API',
  props<{ cartItemId: string; request: UpdateCartItemRequest }>()
);

export const removeCartItemAPI = createAction(
  '[Cart] Remove Cart Item API',
  props<{ cartItemId: string; restaurantId: number; sessionId: string }>()
);

// Legacy/UI actions (some might still be used for local UI state)
export const addToCart =
  createAction('[Cart Component] AddToCart', props<{ product: foodInterface }>())

export const incrementProduct =
  createAction('[Cart Component] IncrementProduct', props<{ productId: string }>())

export const decrementProduct =
  createAction('[Cart Component] DecrementProduct', props<{ productId: string }>())

export const removeItem =
  createAction('[Cart Component] RemoveItem', props<{ productId: string }>())

