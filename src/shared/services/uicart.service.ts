import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UicartService {

  constructor() { }

  showCart = signal(false);

  setShowCart(flag:boolean) {
    this.showCart.set(flag);
  }
}
