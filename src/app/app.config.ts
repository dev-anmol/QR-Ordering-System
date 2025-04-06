import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient} from '@angular/common/http';
import {provideState, provideStore} from '@ngrx/store';
import {CartReducer} from '../state/cart/cart.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStore(),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(),
    provideState({name: 'products', reducer: CartReducer})
  ]
};
