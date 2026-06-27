import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../services/customer/customer.service';
import { GoogleAnalyticsService } from '../../services/google-analytics.service';
import { FoodItemService } from '../../shared/services/foodItems/food-item.service';
import { catchError, of } from 'rxjs';
import gsap from 'gsap';

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
    private analyticsService = inject(GoogleAnalyticsService);
    private foodApi = inject(FoodItemService);

    // State Signals
    restaurantId = signal<string | null>(null);
    restaurantName = signal<string | null>(null);
    tableId = signal<string | null>(null);
    isLoading = signal(true);
    showSuccess = signal(false);
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

        const deviceId = this.customerService.getOrCreateDeviceId();
        this.customerService.generateSessionToken(qrId, deviceId).pipe(
            catchError((err: Error) => {
                this.handleError(err.message || 'Failed to initialize order session.');
                return of(null);
            })
        ).subscribe({
            next: (res: any) => {
                if (res && res.sessionToken) {
                    const restId = res.restaurantId ? res.restaurantId.toString() : null;
                    
                    this.restaurantId.set(restId);
                    this.tableId.set(res.tableNumber ? res.tableNumber.toString() : 'N/A');
                    this.restaurantName.set(res.restaurantName || 'DineSphere Restaurant');
                    this.isLoading.set(false);
                    this.showSuccess.set(true);

                    // Prefetch categories and food items in background during the animation reveal
                    if (restId) {
                        this.foodApi.getCategories(restId).subscribe({
                            error: (err) => console.error('Prefetch categories error:', err)
                        });
                        this.foodApi.getFoodItems(restId).subscribe({
                            error: (err) => console.error('Prefetch food items error:', err)
                        });
                    }

                    // Trigger the GSAP animations after Angular updates the DOM
                    setTimeout(() => this.triggerSuccessAnimations(), 50);

                    // Redirect to menu page after animation (Snappy 2.5-second redirect)
                    setTimeout(() => {
                        this.analyticsService.trackEvent('qr_scanned', { method: 'qr_code' });
                        this.router.navigate(['/menu']);
                    }, 2500);
                }
            }
        });
    }

    triggerSuccessAnimations() {
        // Reset styles for safe re-runs on retry
        gsap.set('.book-cover', { rotateY: 0 });
        gsap.set('.book-page', { rotateY: 0 });
        gsap.set('.table-badge-glow', { scale: 0, opacity: 0, xPercent: -50, yPercent: -50, y: 30 });
        gsap.set('.progress-bar', { width: '0%' });

        // 1. Success badge animation
        gsap.fromTo('.success-badge',
            { scale: 0, opacity: 0, y: -20 },
            { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)' }
        );

        // 2. Restaurant title float in
        gsap.fromTo('.restaurant-title',
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.15 }
        );

        // 3. Front cover swings open (3D flip to left around spine)
        gsap.fromTo('.book-cover',
            { transformOrigin: 'left center', rotateY: 0 },
            { rotateY: -145, duration: 1.2, ease: 'power2.inOut', delay: 0.3 }
        );

        // 4. Staggered inside page turns (flips to right around spine)
        gsap.fromTo('.book-page',
            { transformOrigin: 'right center', rotateY: 0 },
            { rotateY: 135, duration: 1.1, stagger: 0.12, ease: 'power2.inOut', delay: 0.45 }
        );

        // 5. Table Number badge scale & elastic bounce emerging in 3D center
        gsap.fromTo('.table-badge-glow',
            { scale: 0, opacity: 0, xPercent: -50, yPercent: -50, y: 30 },
            { scale: 1, opacity: 1, xPercent: -50, yPercent: -50, y: -45, duration: 0.9, ease: 'elastic.out(1.0, 0.65)', delay: 0.8 }
        );

        // 6. Progress bar loader filling
        gsap.to('.progress-bar', {
            width: '100%',
            duration: 1.8,
            ease: 'power2.inOut',
            delay: 0.5
        });

        // 7. Counter count-up percentage
        const counter = { val: 0 };
        gsap.to(counter, {
            val: 100,
            duration: 1.8,
            ease: 'power2.inOut',
            delay: 0.5,
            onUpdate: () => {
                const el = document.querySelector('.loading-percent');
                if (el) el.textContent = `${Math.floor(counter.val)}%`;
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
