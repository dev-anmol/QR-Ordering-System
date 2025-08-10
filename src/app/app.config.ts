import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideState, provideStore } from '@ngrx/store';
import { providePrimeNG } from 'primeng/config';
import { CartReducer } from '../state/cart/cart.reducer';
import { routes } from './app.routes';
import { provideToastr } from 'ngx-toastr';

import Aura from '@primeuix/themes/aura'
import Material from '@primeuix/themes/material'
import Nora from '@primeuix/themes/nora'
import Lara from '@primeuix/themes/lara'


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
