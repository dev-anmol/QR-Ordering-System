import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order/order.service';
import { CheckoutResponse, OrderStatus } from '../../model/cart.model';
import { OrderTrackingService } from '../../services/order-tracking.service';
import { NotificationBannerComponent } from '../notification-banner/notification-banner.component';

@Component({
    selector: 'app-order-details',
    standalone: true,
    imports: [CommonModule, RouterLink, NotificationBannerComponent],
    templateUrl: './order-details.html',
    styleUrls: ['./order-details.css']
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private orderService = inject(OrderService);
    public trackingService = inject(OrderTrackingService);

    public order = this.trackingService.activeOrder;
    public loading = signal(true);
    public error = signal<string | null>(null);
    public tableId = localStorage.getItem('table_id');
    public userName = localStorage.getItem('user_name');


    public OrderStatus = OrderStatus;

    ngOnInit() {
        this.startPolling();
    }

    startPolling() {
        const orderId = this.route.snapshot.paramMap.get('id');
        if (!orderId) {
            this.error.set('No order ID provided.');
            this.loading.set(false);
            return;
        }

        this.orderService.getOrder(orderId).subscribe({
            next: (fetchedOrder) => {
                if (fetchedOrder) {
                    this.trackingService.startTracking(orderId, fetchedOrder);
                    this.loading.set(false);
                } else {
                    this.error.set('Order not found.');
                    this.loading.set(false);
                }
            },
            error: (err) => {
                this.error.set('Could not load order details.');
                this.loading.set(false);
            }
        });
    }

    ngOnDestroy() {
        // We don't stop tracking here because we want it to continue in the background/header
    }

    getStatusIcon(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.CREATED:
            case OrderStatus.PENDING: return 'hourglass_empty';
            case OrderStatus.PREPARING: return 'restaurant';
            case OrderStatus.PAYMENT_PENDING: return 'flatware';
            case OrderStatus.PAYMENT_REQUESTED: return 'receipt_long';
            case OrderStatus.PAID:
            case OrderStatus.CLOSED: return 'check_circle';
            case OrderStatus.CANCEL:
            case OrderStatus.CANCELLED:
            case OrderStatus.REJECTED: return 'cancel';
            default: return 'help_outline';
        }
    }

    getStatusClass(status: OrderStatus): string {
        return status.toLowerCase();
    }

    isCancelled(): boolean {
        const s = (this.order()?.status || '').toString().toUpperCase();
        return s.includes('CANCEL');
    }

    isRejected(): boolean {
        const s = (this.order()?.status || '').toString().toUpperCase();
        return s.includes('REJECT');
    }

    getStatusMessage(): string {
        const status = this.order()?.status;
        if (!status) return 'Loading Order...';
        
        switch (status) {
            case OrderStatus.CREATED:
            case OrderStatus.PENDING: return 'Order Received';
            case OrderStatus.PREPARING: return 'Preparing Your Food';
            case OrderStatus.PAYMENT_PENDING: return 'Order Served';
            case OrderStatus.PAYMENT_REQUESTED: return 'Bill Generated';
            case OrderStatus.PAID:
            case OrderStatus.CLOSED: return 'Order Completed';
            case OrderStatus.CANCEL:
            case OrderStatus.CANCELLED: return 'Order Cancelled';
            case OrderStatus.REJECTED: return 'Order Rejected';
            default: return 'Order Update';
        }
    }

    getStatusSubtitle(): string {
        const status = this.order()?.status;
        if (!status) return 'Please wait...';

        switch (status) {
            case OrderStatus.CREATED:
            case OrderStatus.PENDING: return 'Waiting for kitchen acceptance';
            case OrderStatus.PREPARING: return 'Chefs are working their magic!';
            case OrderStatus.PAYMENT_PENDING: return 'Food is on your table. Enjoy!';
            case OrderStatus.PAYMENT_REQUESTED: return 'Please review and settle the bill';
            case OrderStatus.PAID:
            case OrderStatus.CLOSED: return 'Hope you enjoyed your meal!';
            case OrderStatus.CANCEL:
            case OrderStatus.CANCELLED: return 'This order has been cancelled.';
            case OrderStatus.REJECTED: return 'Sorry, the order was not accepted.';
            default: return 'Your food journey continues';
        }
    }

    getStatusColorClass(): string {
        const status = this.order()?.status;
        if (!status) return 'gray';
        
        if (this.isCancelled() || this.isRejected()) return 'red';
        
        switch (status) {
            case OrderStatus.CREATED:
            case OrderStatus.PENDING: return 'yellow';
            case OrderStatus.PREPARING: return 'yellow';
            case OrderStatus.PAYMENT_PENDING: return 'indigo';
            case OrderStatus.PAYMENT_REQUESTED: return 'indigo';
            case OrderStatus.PAID:
            case OrderStatus.CLOSED: return 'emerald';
            default: return 'gray';
        }
    }
}
