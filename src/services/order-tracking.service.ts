import { Injectable, inject, signal, OnDestroy, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
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
  private ngZone = inject(NgZone);
  private router = inject(Router);
  
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

  startTracking(orderId: string, initialOrder?: CheckoutResponse) {
    if (!isPlatformBrowser(this.platformId)) return;

    // If initial order is provided, set it if we don't have one yet or it's a different order
    if (initialOrder && (!this.activeOrder() || this.activeOrder()?.orderId !== orderId)) {
      this.activeOrder.set(initialOrder);
      localStorage.setItem(`last_status_${orderId}`, initialOrder.status);
    }

    // If already tracking this order, just return
    if (this.currentOrderId === orderId && this.stompClient?.active) {
      return;
    }

    this.stopTracking();
    this.currentOrderId = orderId;
    localStorage.setItem('last_order_id', orderId);

    console.log('[WS] Connecting to WebSocket for order:', orderId);
    console.log('[WS] Gateway URL:', environment.gatewayUrl);

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${environment.gatewayUrl}/ws`),
      reconnectDelay: 5000,
      debug: (msg) => {
        // Only log connection-related messages, not heartbeats
        if (msg.includes('CONNECTED') || msg.includes('SUBSCRIBE') || msg.includes('ERROR')) {
          console.log('[WS]', msg);
        }
      },
      onConnect: () => {
        console.log('[WS] Connected! Subscribing to /topic/orders/' + orderId);
        this.stompClient?.subscribe(`/topic/orders/${orderId}`, (message) => {
          const updatedOrder = JSON.parse(message.body);
          console.log('[WS] Received order update:', updatedOrder.status || updatedOrder.orderStatus);
          
          // Run inside NgZone so Angular detects the signal change
          this.ngZone.run(() => {
            this.processUpdate(updatedOrder);
          });
        });
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers?.['message'] || frame.body);
      },
      onWebSocketError: (event) => {
        console.error('[WS] WebSocket error:', event);
      },
      onDisconnect: () => {
        console.log('[WS] Disconnected');
      }
    });

    this.stompClient.activate();
  }

  private processUpdate(order: any) {
    // The backend sends the full Order object. Map the status field.
    // Backend Order model uses 'status' field with values like 'PENDING', 'PREPARING', etc.
    const status = order.status as OrderStatus;
    const orderId = order.orderId;
    
    if (!orderId || !status) {
      console.warn('[WS] Received order update with missing orderId or status:', order);
      return;
    }

    const statusKey = `last_status_${orderId}`;
    const previousStatus = localStorage.getItem(statusKey);
    
    console.log('[WS] Status change:', previousStatus, '->', status);

    // Trigger notification if status actually changed
    if (previousStatus !== status) {
      // Only send browser notification when NOT on the live tracking page
      // (no point notifying when user can already see the live update)
      const isOnTrackingPage = this.router.url.includes('/order/');
      console.log('[WS] Status changed! On tracking page:', isOnTrackingPage);
      this.notifyStatusChange(orderId, status, !isOnTrackingPage);
    }
    
    // Store the new status immediately
    localStorage.setItem(statusKey, status);
    
    // Update the signal for UI components — map backend Order to CheckoutResponse shape
    const mapped: CheckoutResponse = {
      orderId: order.orderId,
      status: status,
      totalAmount: order.totalAmount,
      items: order.items,
      paymentStatus: order.paymentStatus,
      reason: order.reason
    };
    this.activeOrder.set(mapped);

    // Auto-stop if final
    const finalStatuses = [OrderStatus.CLOSED, OrderStatus.PAID, OrderStatus.CANCELLED, OrderStatus.REJECTED];
    if (finalStatuses.includes(status)) {
      console.log('[WS] Final status reached, deactivating WebSocket');
      this.stompClient?.deactivate();
    }
  }

  private notifyStatusChange(orderId: string, status: OrderStatus, showBrowserNotification: boolean = true) {
    let title = 'Order Update! 🍽️';
    let message = `Your order status is now: ${this.getFriendlyName(status)}`;

    switch (status) {
      case OrderStatus.PENDING:
        title = 'Order Received! ✅';
        message = 'Your order has been received and is being reviewed.';
        break;
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
      case OrderStatus.CANCELLED:
      case OrderStatus.REJECTED:
        title = 'Order Update ⚠️';
        message = 'Your order status has changed. Please check the details.';
        break;
    }

    this.notificationService.addNotification(title, message, this.getType(status), showBrowserNotification);
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
