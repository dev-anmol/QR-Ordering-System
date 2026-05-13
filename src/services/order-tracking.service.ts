import { Injectable, inject, signal, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../environment/env';
import { NotificationService } from './notification.service';
import { CheckoutResponse, OrderStatus } from '../model/cart.model';

@Injectable({
  providedIn: 'root'
})
export class OrderTrackingService implements OnDestroy {
  private notificationService = inject(NotificationService);
  private platformId = inject(PLATFORM_ID);
  
  private stompClient?: Client;
  
  // The current active order data
  public activeOrder = signal<CheckoutResponse | null>(null);
  private currentOrderId: string | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const lastOrder = localStorage.getItem('last_order_id');
      if (lastOrder) {
        this.startTracking(lastOrder);
      }
    }
  }

  startTracking(orderId: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    // If already tracking this order, just return
    if (this.currentOrderId === orderId && this.stompClient?.active) {
      return;
    }

    this.stopTracking();
    this.currentOrderId = orderId;
    localStorage.setItem('last_order_id', orderId);

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${environment.gatewayUrl}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        this.stompClient?.subscribe(`/topic/orders/${orderId}`, (message) => {
          const updatedOrder = JSON.parse(message.body);
          this.processUpdate(updatedOrder);
        });
      }
    });

    this.stompClient.activate();
  }

  private processUpdate(order: CheckoutResponse) {
    const statusKey = `last_status_${order.orderId}`;
    const previousStatus = localStorage.getItem(statusKey);
    
    // Trigger notification if status changed from what we last knew
    if (previousStatus && previousStatus !== order.status) {
      this.notify(order);
    }
    
    // Store the new status immediately
    localStorage.setItem(statusKey, order.status);
    
    // Update the signal for UI components
    this.activeOrder.set(order);

    // Auto-stop if final
    const finalStatuses = [OrderStatus.CLOSED, OrderStatus.PAID, OrderStatus.CANCELLED, OrderStatus.REJECTED];
    if (finalStatuses.includes(order.status)) {
      this.stompClient?.deactivate();
    }
  }

  private notify(order: CheckoutResponse) {
    let title = 'Order Update! 🍽️';
    let message = `Your order status is now: ${this.getFriendlyName(order.status)}`;

    switch (order.status) {
      case OrderStatus.PREPARING:
        title = 'Cooking in progress! 🍳';
        message = 'The chef has started preparing your delicious meal.';
        break;
      case OrderStatus.PAYMENT_PENDING:
        title = 'Food is Served! 😋';
        message = 'Enjoy your meal! Let us know if you need anything else.';
        break;
      case OrderStatus.PAYMENT_REQUESTED:
        title = 'Bill is Ready 🧾';
        message = 'Your bill has been generated. You can pay at your convenience.';
        break;
      case OrderStatus.PAID:
      case OrderStatus.CLOSED:
        title = 'Thank You! ❤️';
        message = 'Order completed. We hope to see you again soon!';
        break;
    }

    this.notificationService.addNotification(title, message, this.getType(order.status));
  }

  private getFriendlyName(status: OrderStatus): string {
    return status.toString().replace(/_/g, ' ').toLowerCase();
  }

  private getType(status: OrderStatus): 'status' | 'info' | 'success' {
    if ([OrderStatus.PAID, OrderStatus.CLOSED].includes(status)) return 'success';
    if ([OrderStatus.PREPARING, OrderStatus.PAYMENT_PENDING].includes(status)) return 'status';
    return 'info';
  }

  stopTracking() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = undefined;
    }
    this.currentOrderId = null;
  }

  ngOnDestroy() {
    this.stopTracking();
  }
}
