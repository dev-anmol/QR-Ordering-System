import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { apiFormat } from '../../../model/api.interface';
import { foodInterface } from '../../../model/food.interface';
import { environment } from '../../../environment/env';

@Injectable({
  providedIn: 'root'
})
export class FoodItemService {
  private http = inject(HttpClient);

  constructor() {
  }

  private menuApiUrl = environment.menuUrl;

  getCategories(restaurantId?: string) {
    return this.http.get<any[]>(`${this.menuApiUrl}/categories`);
  }

  getFoodItems(restaurantId?: string, categoryId?: string | number) {
    const url = `${this.menuApiUrl}/items`;
    const params: any = {};
    if (restaurantId) params.restaurantId = restaurantId;
    if (categoryId) params.categoryId = categoryId;

    return this.http.get<{ items: any[], totalElements: number }>(url, { params })

      .pipe(
        map((response) => {
          return response.items.map((item: any) => {
            return {
              id: item.menuItemId,
              name: item.name,
              image: item.imageUrl,
              description: item.description,
              veg: item.veg,
              quantity: 1,
              price: item.basePrice,
              enabled: item.enabled,
              categoryId: item.categoryId,
              variants: item.variants,
              addons: item.addons
            }

          })
        })
      );
  }

}
