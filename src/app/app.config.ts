import {ApplicationConfig, importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient} from '@angular/common/http';
import {provideState, provideStore} from '@ngrx/store';
import {CartReducer} from '../state/cart/cart.reducer';
import {provideAnimations} from '@angular/platform-browser/animations';
import {ToastrModule} from 'ngx-toastr';


export const appConfig: ApplicationConfig = {
  providers: [
    provideStore(),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(),
    provideState({name: 'products', reducer: CartReducer}),
    provideAnimations(),
    importProvidersFrom(
      ToastrModule.forRoot({
        positionClass: 'toast-top-center',
        timeOut: 3000,
        preventDuplicates: true
      })
    )
  ]
};
