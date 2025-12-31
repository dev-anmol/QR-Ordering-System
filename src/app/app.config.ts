import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';

import {provideHttpClient, withFetch} from '@angular/common/http';
import {provideState, provideStore} from '@ngrx/store';
import {CartReducer} from '../state/cart/cart.reducer';
import {routes} from './app.routes';
import {provideClientHydration, withIncrementalHydration} from '@angular/platform-browser';


export const appConfig: ApplicationConfig = {
  providers: [
    provideStore(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(withIncrementalHydration()),
    provideState({ name: 'products', reducer: CartReducer }),
  ]
};
