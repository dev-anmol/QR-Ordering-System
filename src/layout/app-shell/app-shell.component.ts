import { Component } from '@angular/core';
import {Header} from '../../components/header/header';
import {RouterOutlet} from '@angular/router';
import {Footer} from '../../components/footer/footer';

@Component({
  selector: 'app-app-shell',
  imports: [
    Header,
    RouterOutlet,
    Footer
  ],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {

}
