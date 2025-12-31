import {Component, inject, signal, WritableSignal} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {Header} from '../components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
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
