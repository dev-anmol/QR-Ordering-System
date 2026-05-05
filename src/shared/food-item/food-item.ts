import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { foodInterface } from '../../model/food.interface';

@Component({
  selector: 'app-food-item',
  standalone: true,
  imports: [],
  templateUrl: './food-item.html',
  styleUrl: './food-item.css'
})
export class FoodItem {
  @Input() foodItem !: foodInterface;
  @Input() quantity: number = 0;
  @Output() handleAdd = new EventEmitter();
  @Output() handleRemove = new EventEmitter();

  addToCart(item: foodInterface) {
    this.handleAdd.emit(item);
  }

  decreaseQuantity(item: foodInterface) {
    this.handleRemove.emit(item);
  }
}

