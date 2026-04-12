import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/env';
import { Observable } from 'rxjs';
import { AddToCartRequest, Cart, UpdateCartItemRequest, CheckoutRequest, CheckoutResponse } from '../../model/cart.model';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private http = inject(HttpClient);
    private cartUrl = environment.cartUrl;

    addItem(req: AddToCartRequest): Observable<Cart> {
        return this.http.post<Cart>(`${this.cartUrl}/items`, req);
    }

    getCart(restaurantId: number, sessionId: string, tableNumber: number = 1): Observable<Cart> {
        return this.http.get<Cart>(`${this.cartUrl}`);
    }

    updateItemQuantity(cartItemId: string, req: UpdateCartItemRequest): Observable<Cart> {
        return this.http.put<Cart>(`${this.cartUrl}/items/${cartItemId}`, req);
    }

    removeItem(cartItemId: string, restaurantId: number, sessionId: string): Observable<Cart> {
        let params = new HttpParams()
            .set('restaurantId', restaurantId.toString())
            .set('sessionId', sessionId);
        return this.http.delete<Cart>(`${this.cartUrl}/items/${cartItemId}`, { params });
    }

    clearCart(restaurantId: number, sessionId: string): Observable<void> {
        let params = new HttpParams()
            .set('restaurantId', restaurantId.toString())
            .set('sessionId', sessionId);
        return this.http.delete<void>(`${this.cartUrl}`, { params });
    }

    checkout(req: CheckoutRequest): Observable<CheckoutResponse> {
        return this.http.post<CheckoutResponse>(`${this.cartUrl}/checkout`, req);
    }
}
