import { createSelector } from '@ngrx/store';
import { AppState } from '../app.state';

export const selectProductState = (state: AppState) => state.products

export const selectProducts = createSelector(
  selectProductState,
  (state) => state.products
)

export const selectCart = createSelector(
  selectProductState,
  (state) => state.cart
)

export const selectCartItemsCount = createSelector(
  selectCart,
  (cart) => cart ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0
)

export const selectCartQuantityMap = createSelector(
  selectCart,
  (cart) => {
    const map: { [key: string]: number } = {};
    if (cart) {
      cart.items.forEach(item => {
        map[item.menuItemId] = (map[item.menuItemId] || 0) + item.quantity;
      });
    }
    return map;
  }
)



