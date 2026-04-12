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

    // Generate session token for the customer using secure QR ID
    generateSessionToken(qrId: string): Observable<any> {
        return this.http.post(`${environment.authUrl}/session/start`, {
            qrId
        }).pipe(
            tap((response: any) => {
                // response: { sessionToken: string, expiresIn: number }
                if (response && response.sessionToken) {
                    this.setCookie('customer_session', response.sessionToken, 1); // 1 day expire
                    if (response.restaurantId) localStorage.setItem('restaurant_id', response.restaurantId);
                    if (response.tableId) localStorage.setItem('table_id', response.tableId);
                }
            })
        );
    }

    getSessionToken(): string | null {
        return this.getCookie('customer_session');
    }

    clearSession(): void {
        this.deleteCookie('customer_session');
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
