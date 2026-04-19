import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../services/customer/customer.service';
import { catchError, of } from 'rxjs';

@Component({
    selector: 'app-order-init',
    standalone: true,
    imports: [],
    templateUrl: './order-init.html',
    styleUrl: './order-init.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderInitComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private customerService = inject(CustomerService);

    // State Signals
    restaurantId = signal<string | null>(null);
    tableId = signal<string | null>(null);
    isLoading = signal(true);
    error = signal(false);
    errorMessage = signal<string | null>(null);

    ngOnInit() {
        this.initializeOrderFlow();
    }

    initializeOrderFlow() {
        const qrId = this.route.snapshot.queryParamMap.get('qrId');

        if (!qrId) {
            this.handleError('Invalid or missing QR code. Please scan again.');
            return;
        }

        // If the customer already has a valid session cookie, skip re-auth and
        // go straight to the menu — their cart/order is still alive on the backend.
        const existingSession = this.customerService.getSessionToken();
        if (existingSession) {
            console.log('[OrderInit] Existing session found — skipping re-auth, resuming session.');
            this.router.navigate(['/menu']);
            return;
        }

        // No existing session: start a new one.
        // We send the persistent deviceId so the backend can look up any
        // prior orders/cart tied to this device and restore them.
        const deviceId = this.customerService.getOrCreateDeviceId();
        this.customerService.generateSessionToken(qrId, deviceId).pipe(
            catchError((err: Error) => {
                this.handleError(err.message || 'Failed to initialize order session.');
                return of(null);
            })
        ).subscribe({
            next: (res: any) => {
                if (res && res.sessionToken) {
                    // Success! Redirect to menu page (via API Gateway)
                    this.router.navigate(['/menu']);
                }
            }
        });
    }

    private handleError(message: string) {
        this.isLoading.set(false);
        this.error.set(true);
        this.errorMessage.set(message);
    }

    retry() {
        this.isLoading.set(true);
        this.error.set(false);
        this.errorMessage.set(null);
        this.initializeOrderFlow();
    }
}
