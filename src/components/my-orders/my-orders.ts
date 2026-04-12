import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
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
export class MyOrdersComponent implements OnInit, OnDestroy {
    private orderService = inject(OrderService);
    
    public orders = signal<CheckoutResponse[]>([]);
    public loading = signal(true);
    public error = signal<string | null>(null);
    public OrderStatus = OrderStatus;

    private timeoutId: any;
    private isFetching = false;

    ngOnInit() {
        this.fetchMyOrders(true);
    }

    ngOnDestroy() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }

    private hasActiveOrders(orders: CheckoutResponse[]): boolean {
        return orders.some(o => 
            o.status === OrderStatus.PENDING || 
            o.status === OrderStatus.PREPARING || 
            o.status === OrderStatus.READY
        );
    }

    fetchMyOrders(showLoading = true) {
        if (this.isFetching) return;
        this.isFetching = true;

        if (showLoading) {
            this.loading.set(true);
        }

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        this.orderService.getMyOrders().subscribe({
            next: (data) => {
                const ordersList = data || [];
                this.orders.set(ordersList);
                this.loading.set(false);
                this.isFetching = false;

                if (ordersList.length > 0 && this.hasActiveOrders(ordersList)) {
                    this.timeoutId = setTimeout(() => {
                        this.fetchMyOrders(false);
                    }, 2000);
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
}
