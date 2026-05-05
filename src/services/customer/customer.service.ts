import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/env';
import { Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private http = inject(HttpClient);


    // Check if restaurant is accepting orders
    checkRestaurantStatus(restaurantId: string): Observable<any> {
        return this.http.get(`${environment.baseUrl}${environment.restaurant}/${restaurantId}/status`);
    }

    // Generate session token for the customer using secure QR ID.
    // Passing deviceId allows the backend to restore any prior order/cart
    // for this physical device even if the session cookie expired.
    generateSessionToken(qrId: string, deviceId?: string): Observable<any> {
        const body: any = { qrId };
        if (deviceId) body.deviceId = deviceId;
        return this.http.post(`${environment.authUrl}/session/start`, body).pipe(
            tap((response: any) => {
                // response: { sessionToken: string, expiresIn: number }
                if (response && response.sessionToken) {
                    this.setCookie('customer_session', response.sessionToken, 1); // 1 day expire
                    if (response.refreshToken) this.setCookie('customer_refresh_token', response.refreshToken, 1);
                    if (response.restaurantId) localStorage.setItem('restaurant_id', response.restaurantId);
                    if (response.tableNumber) localStorage.setItem('table_id', response.tableNumber.toString());
                }
            })

        );
    }

    refreshSessionToken(refreshToken: string): Observable<any> {
        return this.http.post(`${environment.authUrl}/session/refresh`, { refreshToken }).pipe(
            tap((response: any) => {
                if (response && response.sessionToken) {
                    this.setCookie('customer_session', response.sessionToken, 1);
                    if (response.refreshToken) this.setCookie('customer_refresh_token', response.refreshToken, 1);
                }
            })
        );
    }

    // Returns the persistent device ID for this browser.
    // Creates one if it doesn't exist yet (stored in localStorage).
    getOrCreateDeviceId(): string {
        const DEVICE_ID_KEY = 'customer_device_id';
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(DEVICE_ID_KEY);
            if (stored) return stored;
        }
        const newId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(DEVICE_ID_KEY, newId);
        }
        return newId;
    }

    getSessionToken(): string | null {
        return this.getCookie('customer_session');
    }

    getRefreshToken(): string | null {
        return this.getCookie('customer_refresh_token');
    }

    clearSession(): void {
        this.deleteCookie('customer_session');
        this.deleteCookie('customer_refresh_token');
        localStorage.removeItem('restaurant_id');
        localStorage.removeItem('table_id');
    }

    private setCookie(name: string, value: string, days: number): void {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "; expires=" + date.toUTCString();
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
    }

    private getCookie(name: string): string | null {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    private deleteCookie(name: string): void {
        document.cookie = name + '=; Max-Age=-99999999; path=/;';
    }
}
