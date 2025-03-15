import { Routes } from '@angular/router';
import {MenuPageComponent} from '../components/menu-page/menu-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('../components/landing-page/landing-page.component').then(m => m.LandingPageComponent),
  },
  {
    path: 'menu',
    pathMatch: "full",
    component: MenuPageComponent,
    // loadComponent: () => import('../components/menu-page/menu-page.component').then(m => m.MenuPageComponent)
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: ''
  }
];
