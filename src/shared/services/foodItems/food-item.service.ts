import {inject, Injectable, Signal, WritableSignal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, map} from 'rxjs';
import {log} from '@angular-devkit/build-angular/src/builders/ssr-dev-server';
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
              return {...item, quantity : 1}
          })
        })
      )
  }
}
