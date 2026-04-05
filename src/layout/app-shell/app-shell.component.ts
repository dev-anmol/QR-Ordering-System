import { Component, inject } from '@angular/core';
import { Header } from '../../components/header/header';
import { RouterOutlet, Router } from '@angular/router';
import { Footer } from '../../components/footer/footer';
import { BottomNav } from '../../components/bottom-nav/bottom-nav';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [
    Header,
    RouterOutlet,
    Footer,
    BottomNav,
    CommonModule
  ],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  private router = inject(Router);

  isCartPage(): boolean {
    return this.router.url.includes('/cart');
  }
}
