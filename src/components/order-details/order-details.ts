import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order/order.service';
import { CheckoutResponse, OrderStatus } from '../../model/cart.model';
import { Subscription, switchMap, timer } from 'rxjs';

@Component({
    selector: 'app-order-details',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './order-details.html',
    styleUrls: ['./order-details.css']
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private orderService = inject(OrderService);
    private pollingSubscription?: Subscription;

    public order = signal<CheckoutResponse | null>(null);
    public loading = signal(true);
    public error = signal<string | null>(null);
    public tableId = localStorage.getItem('table_id');


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

        // Using timer(0, 5000) runs immediately, then waits 5 seconds between calls
        this.pollingSubscription = timer(0, 5000)
            .pipe(
                switchMap(() => this.orderService.getOrder(orderId))
            )
            .subscribe({
                next: (fetchedOrder) => {
                    if (fetchedOrder) {
                        this.order.set(fetchedOrder);
                        this.loading.set(false);
                        // Stop polling if finalized
                        const stopPollingStatuses = [
                            OrderStatus.CLOSED,
                            OrderStatus.PAID,
                            OrderStatus.CANCEL,
                            OrderStatus.CANCELLED,
                            OrderStatus.REJECTED,
                            'CANCELED' as OrderStatus,
                            'REJECT' as OrderStatus
                        ];
                        if (stopPollingStatuses.includes(fetchedOrder.status)) {
                            this.pollingSubscription?.unsubscribe();
                        }
                    } else {
                        this.error.set('Order not found.');
                        this.loading.set(false);
                        this.pollingSubscription?.unsubscribe();
                    }
                },
                error: (err) => {
                    console.error('Polling error:', err);
                    this.error.set('Could not load order details. Please refresh or check back later.');
                    this.loading.set(false);
                    this.pollingSubscription?.unsubscribe();
                }
            });
    }

    ngOnDestroy() {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }
    }

    getStatusIcon(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.CREATED: return 'hourglass_empty';
            case OrderStatus.PENDING: return 'pending_actions';
            case OrderStatus.PREPARING: return 'restaurant';
            case OrderStatus.PAYMENT_PENDING:
            case OrderStatus.PAYMENT_REQUESTED: return 'payment';
            case OrderStatus.PAID: return 'check_circle';
            case OrderStatus.CLOSED: return 'done_all';
            case OrderStatus.CANCEL:
            case OrderStatus.CANCELLED:
            case OrderStatus.REJECTED: return 'cancel';
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
}
