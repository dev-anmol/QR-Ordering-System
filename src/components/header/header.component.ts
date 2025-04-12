import {Component, inject, signal, WritableSignal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {UicartService} from '../../shared/services/uicart/uicart.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  public router = inject(Router);
  public ui = inject(UicartService);

}
