import {Component, EventEmitter, Input, Output} from '@angular/core';
import {foodInterface} from '../../model/food.interface';

@Component({
  selector: 'app-food-item',
  imports: [],
  templateUrl: './food-item.component.html',
  styleUrl: './food-item.component.css'
})
export class FoodItemComponent {
  @Input() foodItem !: foodInterface ;
  @Output() handleAdd = new EventEmitter();

  addToCart(item: foodInterface) {
    this.handleAdd.emit(item);
  }
}
