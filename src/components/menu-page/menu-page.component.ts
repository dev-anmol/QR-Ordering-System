import { Component } from '@angular/core';
import {HeaderComponent} from '../header/header.component';
import {RouterOutlet} from '@angular/router';
import {FooterComponent} from '../footer/footer.component';

@Component({
  selector: 'app-menu-page',
  imports: [
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.css'
})
export class MenuPageComponent {

}
