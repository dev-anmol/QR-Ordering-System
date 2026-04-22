import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order/order.service';
import { CheckoutResponse, OrderStatus } from '../../model/cart.model';

@Component({
    selector: 'app-my-orders',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './my-orders.html',
    styleUrls: ['./my-orders.css']
})
export class MyOrdersComponent implements OnInit {
    private orderService = inject(OrderService);
    
    public orders = signal<CheckoutResponse[]>([]);
    public loading = signal(true);
    public error = signal<string | null>(null);
    public OrderStatus = OrderStatus;

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
            },
            error: (err) => {
                console.error('Error fetching orders:', err);
                this.error.set('Failed to load your orders.');
                this.loading.set(false);
                this.isFetching = false;
            }
        });
    }
}
