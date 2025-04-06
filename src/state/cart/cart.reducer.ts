import {createReducer, on} from '@ngrx/store';
import {foodInterface} from '../../model/food.interface';
import * as CartActions from './cart.actions'

export interface CartState {
  products: foodInterface[],
  totalPrice?: number
}

export const initialCounterState: CartState = {
  products: []
}

export const CartReducer = createReducer(
  initialCounterState,
  on(CartActions.addToCart, (state, {product}) => {
    const updateState = [...state.products, product]
    return {
      ...state,
      products: updateState
    }
  }),
  on(CartActions.removeItem, (state, {productId}) => {
    const updatedState = state.products.filter((item) =>
      item.id !== productId
    )
    return {
      ...state,
      products: updatedState
    }
  }),
  on(CartActions.incrementProduct, (state, {productId}) => {
    const updatedState = state.products.map((item) =>
      item.id === productId ? {...item, quantity: item.quantity++} : item
    )
    return {
      ...state,
      products: updatedState
    }
  }),
  on(CartActions.decrementProduct, (state, {productId}) => {
    const updatedState = state.products.map((item) =>
      item.id === productId ? {...item, quantity: item.quantity--} : item
    );
    return {
      ...state,
      products: updatedState
    }
  })
)
