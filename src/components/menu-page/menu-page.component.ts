import {Component, inject, OnInit} from '@angular/core';
import {FooterComponent} from '../footer/footer.component';
import {FoodItemService} from '../../shared/services/foodItems/food-item.service';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {FoodItemComponent} from '../../shared/food-item/food-item.component';
import {foodInterface} from '../../model/food.interface';
import {MenuFooterComponent} from '../menu-footer/menu-footer.component';

@Component({
  selector: 'app-menu-page',
  imports: [
    FooterComponent,
    AsyncPipe,
    FoodItemComponent,
    MenuFooterComponent,
  ],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.css'
})
export class MenuPageComponent implements OnInit{

  private http = inject(HttpClient);
  private foodApi = inject(FoodItemService);
  foodItem$ = this.foodApi.getFoodItems() as Observable<foodInterface[]>;

  ngOnInit() {
    console.log(this.foodApi.getFoodItems().subscribe(data => console.log(data)));
  }

}
