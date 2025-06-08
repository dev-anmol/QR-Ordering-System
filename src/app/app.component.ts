import {Component, inject, signal, WritableSignal} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {HeaderComponent} from '../components/header/header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private router = inject(Router);
  currentRoute : WritableSignal<string> = signal('');
  
  constructor() {
    this.router.events.subscribe((e) => {
      if(e instanceof NavigationEnd) {
        this.currentRoute.set(e.url);
      }
    })
  }
}
