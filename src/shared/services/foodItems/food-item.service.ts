import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs';
import {apiFormat} from '../../../model/api.interface';
import {foodInterface} from '../../../model/food.interface';

@Injectable({
  providedIn: 'root'
})
export class FoodItemService {
  private http = inject(HttpClient);

  constructor() {
  }

  getFoodItems() {
    return this.http.get<apiFormat>('https://dummyjson.com/recipes')
      .pipe(
        map((items) => {
          return items.recipes.map((item:foodInterface) => {
              return {...item, quantity : 1, price: Math.floor(Math.random() * (1500 - 400 + 1)) + 400}
          })
        })
      )
  }
}
