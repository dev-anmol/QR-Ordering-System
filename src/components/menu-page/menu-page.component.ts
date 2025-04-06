import {Component, inject, OnInit, signal} from '@angular/core';
import {FoodItemService} from '../../shared/services/foodItems/food-item.service';
import {FoodItemComponent} from '../../shared/food-item/food-item.component';
import {MenuFooterComponent} from '../menu-footer/menu-footer.component';
import {foodInterface} from '../../model/food.interface';

@Component({
  selector: 'app-menu-page',
  imports: [
    FoodItemComponent,
    MenuFooterComponent,
  ],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.css'
})
export class MenuPageComponent implements OnInit {

  private foodApi = inject(FoodItemService);
  foodItem = signal<foodInterface[]>([]);
  isLoading = signal(true);
  hasError = signal(false);

  ngOnInit() {
    this.foodApi.getFoodItems().subscribe({
      next: (data) => {
        this.foodItem.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching food items:', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }
}
