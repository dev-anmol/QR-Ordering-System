import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, retry, throwError, timer } from 'rxjs';
import { Router } from '@angular/router';

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

    // 2. Add Authorization header for everything EXCEPT session start
    if (token && !req.url.includes('/auth/session/start')) {
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
            if (error.status === 401) {
                console.warn('Session expired or unauthorized. Clearing local data and redirecting to login.');
                
                if (isBrowser) {
                    // Clear Sensitive Data
                    localStorage.removeItem('customer_device_id');
                    localStorage.removeItem('restaurant_id');
                    // We don't necessarily want to clear EVERYTHING if some things are needed, 
                    // but usually for 401 we want a clean slate.
                    localStorage.clear(); 
                    
                    // Clear Auth Cookie
                    deleteCookie('customer_session');
                    
                    // Redirect to login
                    // window.location.href = '/login'; is often safer for auth resets
                    router.navigate(['/login']);
                }
            }
            return throwError(() => error);
        })
    );
};
