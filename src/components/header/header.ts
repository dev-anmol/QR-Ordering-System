import {Component, inject, signal, WritableSignal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';

import {UicartService} from '../../shared/services/uicart/uicart.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
})
export class Header {
  public router = inject(Router);
  public ui = inject(UicartService);

}
