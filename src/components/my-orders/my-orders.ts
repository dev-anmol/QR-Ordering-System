import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order/order.service';
import { CustomerService } from '../../services/customer/customer.service';
import { CheckoutResponse, OrderStatus } from '../../model/cart.model';

import { NotificationBannerComponent } from '../notification-banner/notification-banner.component';

@Component({
    selector: 'app-my-orders',
    standalone: true,
    imports: [CommonModule, RouterLink, NotificationBannerComponent],
    templateUrl: './my-orders.html',
    styleUrls: ['./my-orders.css']
})
export class MyOrdersComponent implements OnInit {
    private orderService = inject(OrderService);
    private customerService = inject(CustomerService);
    
    public orders = signal<CheckoutResponse[]>([]);
    public activeBill = signal<any | null>(null);
    public loading = signal(true);
    public error = signal<string | null>(null);
    public OrderStatus = OrderStatus;
    public userName = localStorage.getItem('user_name');

    public expandedOrderId = signal<string | null>(null);
    private isFetching = false;

    toggleExpandedOrder(orderId: string, event: Event) {
        event.stopPropagation();
        if (this.expandedOrderId() === orderId) {
            this.expandedOrderId.set(null);
        } else {
            this.expandedOrderId.set(orderId);
        }
    }

    ngOnInit() {
        this.fetchMyOrders(true);
    }

    fetchMyOrders(showLoading = true) {
        if (this.isFetching) return;
        this.isFetching = true;

        if (showLoading) {
            this.loading.set(true);
        }

        this.orderService.getMyOrders().subscribe({
            next: (data) => {
                const ordersList = data || [];
                this.orders.set(ordersList);
                this.loading.set(false);
                this.isFetching = false;

                // Only fetch bill if there are active orders (not rejected or cancelled)
                const hasActiveOrders = ordersList.some(order => 
                    order.status !== OrderStatus.REJECTED && 
                    order.status !== OrderStatus.CANCEL && 
                    order.status !== OrderStatus.CANCELLED
                );

                if (hasActiveOrders) {
                    this.fetchMyBill();
                } else {
                    this.activeBill.set(null);
                }
            },
            error: (err) => {
                console.error('Error fetching orders:', err);
                this.error.set('Failed to load your orders.');
                this.loading.set(false);
                this.isFetching = false;
            }
        });
    }

    fetchMyBill() {
        this.customerService.getMyBill().subscribe({
            next: (bill) => {
                this.activeBill.set(bill);
            },
            error: (err) => {
                // Bill might not be generated yet, which is fine (404)
                if (err.status !== 404) {
                    console.error('Error fetching bill:', err);
                }
                this.activeBill.set(null);
            }
        });
    }

    isCancelled(status: any): boolean {
        const s = (status || '').toString().toUpperCase();
        return s.includes('CANCEL');
    }

    isRejected(status: any): boolean {
        const s = (status || '').toString().toUpperCase();
        return s.includes('REJECT');
    }
}
