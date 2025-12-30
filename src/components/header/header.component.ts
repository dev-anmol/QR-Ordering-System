import {Component, inject, signal, WritableSignal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';

import {UicartService} from '../../shared/services/uicart/uicart.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  public router = inject(Router);
  public ui = inject(UicartService);

}
