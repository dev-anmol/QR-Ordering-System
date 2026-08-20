import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../layout/app-shell/app-shell.component').then(m => m.AppShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'menu'
      }, {
        path: 'menu',
        loadComponent: async () => import('../components/menu-page/menu-page').then(m => m.MenuPage)
      }, {
        path: 'cart',
        loadComponent: async () => import('../components/cart/cart').then(m => m.Cart)
      }, {
        path: 'orders',
        loadComponent: async () => import('../components/my-orders/my-orders').then(m => m.MyOrdersComponent)
      }, {
        path: 'order/:id',
        loadComponent: async () => import('../components/order-details/order-details').then(m => m.OrderDetailsComponent)
      }
    ]
  },
  {
    path: 'qr',
    loadComponent: () => import('../components/order-init/order-init').then(m => m.OrderInitComponent)
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: ''
  }
];
