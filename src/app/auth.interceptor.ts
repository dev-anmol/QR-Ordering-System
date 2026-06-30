import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, retry, throwError, timer, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { CustomerService } from '../services/customer/customer.service';
import { AlertService } from '../services/alert/alert.service';

// Helper to get cookies
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Helper to delete cookies
function deleteCookie(name: string) {
    if (typeof document !== 'undefined') {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
}

// Persist in localStorage to survive page reloads and act as a reliable device identifier
let cachedDeviceId: string | null = null;

function getOrCreateDeviceId(): string {
    if (cachedDeviceId) return cachedDeviceId;
    
    const DEVICE_ID_KEY = 'customer_device_id';
    
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(DEVICE_ID_KEY);
        if (stored) {
            cachedDeviceId = stored;
            return cachedDeviceId;
        }
    }
    
    let newId: string;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        newId = crypto.randomUUID();
    } else {
        newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(DEVICE_ID_KEY, newId);
    }
    
    cachedDeviceId = newId;
    return cachedDeviceId;
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    const router = inject(Router);
    const customerService = inject(CustomerService);
    const alertService = inject(AlertService);

    // Only intercept if we're in the browser
    if (!isBrowser) {
        return next(req);
    }

    const token = getCookie('customer_session');
    const deviceId = getOrCreateDeviceId();

    let headers: { [name: string]: string } = {};

    // 1. Add Device ID to ALL requests as requested
    headers['X-Device-Id'] = deviceId;

    // 2. Add Restaurant ID from localStorage if available
    const restaurantId = typeof localStorage !== 'undefined' ? localStorage.getItem('restaurant_id') : null;
    if (restaurantId) {
        headers['X-Restaurant-Id'] = restaurantId;
    }

    const tableId = typeof localStorage !== 'undefined' ? localStorage.getItem('table_id') : null;
    if (tableId) {
        headers['X-Table-No'] = tableId;
    }

    // 2. Add Authorization header for everything EXCEPT session start and refresh
    if (token && !req.url.includes('/auth/session/start') && !req.url.includes('/auth/session/refresh')) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-Session-Token'] = token;
    }

    const outgoing = Object.keys(headers).length > 0
        ? req.clone({ setHeaders: headers })
        : req;

    // 3. Handle status codes and retries
    return next(outgoing).pipe(
        retry({
            count: 3,
            delay: (error, retryCount) => {
                if (error.status === 429 && req.method === 'GET') {
                    const delayMs = Math.pow(2, retryCount) * 1000;
                    return timer(delayMs);
                }
                throw error;
            }
        }),
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !req.url.includes('/auth/session/refresh')) {
                const refreshToken = getCookie('customer_refresh_token');
                
                if (isBrowser && refreshToken) {
                    console.log('Session expired, attempting to refresh token...');
                    return customerService.refreshSessionToken(refreshToken).pipe(
                        switchMap((res: any) => {
                            if (res && res.sessionToken) {
                                // Retry original request with new token
                                const newReq = req.clone({
                                    setHeaders: {
                                        'Authorization': `Bearer ${res.sessionToken}`,
                                        'X-Session-Token': res.sessionToken,
                                        'X-Device-Id': deviceId
                                    }
                                });
                                return next(newReq);
                            }
                            return throwError(() => error);
                        }),
                        catchError((refreshErr) => {
                            console.warn('Refresh token failed or expired.');
                            deleteCookie('customer_session');
                            deleteCookie('customer_refresh_token');
                            alertService.show('Session Expired', 'Your session has expired. Please scan the QR code on your table again to continue ordering.', 'warning');
                            return throwError(() => refreshErr);
                        })
                    );
                } else if (isBrowser) {
                    console.warn('Session expired and no refresh token available.');
                    deleteCookie('customer_session');
                    alertService.show('Session Expired', 'Your session has expired. Please scan the QR code on your table again to continue ordering.', 'warning');
                }
            }
            return throwError(() => error);
        })
    );
};
