import {Component, EventEmitter, Input, Output, signal} from '@angular/core';
import {foodInterface} from '../../model/food.interface';

@Component({
  selector: 'app-food-item',
  imports: [],
  templateUrl: './food-item.html',
  styleUrl: './food-item.css'
})
export class FoodItem {
  @Input() foodItem !: foodInterface ;
  @Output() handleAdd = new EventEmitter();

  addToCart(item: foodInterface) {
    this.handleAdd.emit(item);
  }
}
