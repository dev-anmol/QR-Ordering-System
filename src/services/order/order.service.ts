import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/env';
import { Observable } from 'rxjs';
import { CheckoutResponse } from '../../model/cart.model';
import { CustomerService } from '../customer/customer.service';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private http = inject(HttpClient);
    private customerService = inject(CustomerService);
    private orderUrl = `${environment.baseUrl}${environment.order}`;

    getOrder(orderId: string): Observable<CheckoutResponse> {
        return this.http.get<CheckoutResponse>(`${this.orderUrl}/${orderId}`);
    }

    getMyOrders(): Observable<CheckoutResponse[]> {
        return this.http.get<CheckoutResponse[]>(`${this.orderUrl}/my`);
    }
}
