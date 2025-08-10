import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideState, provideStore } from '@ngrx/store';
import { provideToastr } from 'ngx-toastr';
import { CartReducer } from '../state/cart/cart.reducer';
import { routes } from './app.routes';



export const appConfig: ApplicationConfig = {
  providers: [
    provideStore(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideState({ name: 'products', reducer: CartReducer }),
    provideAnimations(),
    provideAnimationsAsync(),
    provideToastr({
      positionClass: 'toast-top-right',
      timeOut: 3000,
      progressBar: true,
      progressAnimation: 'decreasing',
      toastClass: 'custom-toastr'
    }),
  ]
};
