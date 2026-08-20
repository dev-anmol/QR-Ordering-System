import { createReducer, on } from '@ngrx/store';
import { foodInterface } from '../../model/food.interface';
import { Cart } from '../../model/cart.model';
import * as CartActions from './cart.actions'

export interface CartState {
  products: foodInterface[];
  cart: Cart | null;
  totalPrice?: number;
  loading: boolean;
  error: any;
}

export const initialCounterState: CartState = {
  products: [],
  cart: null,
  loading: false,
  error: null
}

export const CartReducer = createReducer(
  initialCounterState,
  on(CartActions.loadCart, (state) => ({
    ...state,
    loading: true
  })),
  on(CartActions.loadCartSuccess, (state, { cart }) => ({
    ...state,
    cart,
    loading: false,
    error: null
  })),
  on(CartActions.loadCartFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(CartActions.addToCart, (state, { product }) => {
    const updateState = [...state.products, product]
    return {
      ...state,
      products: updateState
    }
  }),
  on(CartActions.removeItem, (state, { productId }) => {
    const updatedState = state.products.filter((item) =>
      item.id !== productId
    )
    return {
      ...state,
      products: updatedState
    }
  }),
  on(CartActions.incrementProduct, (state, { productId }) => {
    const updatedState = state.products.map((item) =>
      item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
    )
    return {
      ...state,
      products: updatedState
    }
  }),
  on(CartActions.decrementProduct, (state, { productId }) => {
    const updatedState = state.products.map((item) =>
      item.id === productId ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 1 } : item
    );
    return {
      ...state,
      products: updatedState
    }
  })
)

