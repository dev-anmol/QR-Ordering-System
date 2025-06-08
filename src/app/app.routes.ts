import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('../components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'home',
    pathMatch: 'full',
    loadComponent: () => import('../components/landing-page/landing-page.component').then(m => m.LandingPageComponent),
  },
  {
    path: 'menu',
    pathMatch: "full",
    loadComponent: () => import('../components/menu-page/menu-page.component').then(m => m.MenuPageComponent)
  }, {
    path: 'cart',
    pathMatch: "full",
    loadComponent: () => import('../components/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: ''
  }
];
