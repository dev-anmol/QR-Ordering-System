import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, of, tap } from 'rxjs';
import { apiFormat } from '../../../model/api.interface';
import { foodInterface } from '../../../model/food.interface';
import { environment } from '../../../environment/env';

@Injectable({
  providedIn: 'root'
})
export class FoodItemService {
  private http = inject(HttpClient);
  private menuApiUrl = environment.menuUrl;

  // In-memory caching for performance on slow networks
  private categoriesCache: any[] | null = null;
  private foodItemsCache: Record<string, any[]> = {};

  constructor() {}

  getCategories(restaurantId?: string) {
    if (this.categoriesCache) {
      return of(this.categoriesCache);
    }
    return this.http.get<any[]>(`${this.menuApiUrl}/categories`).pipe(
      tap((data) => {
        this.categoriesCache = data;
      })
    );
  }

  getFoodItems(restaurantId?: string, categoryId?: string | number) {
    const cacheKey = `${restaurantId || 'default'}-${categoryId || 'all'}`;
    if (this.foodItemsCache[cacheKey]) {
      return of(this.foodItemsCache[cacheKey]);
    }

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
            };
          });
        }),
        tap((items) => {
          this.foodItemsCache[cacheKey] = items;
        })
      );
  }

  // Helper to clear cache if needed
  clearCache() {
    this.categoriesCache = null;
    this.foodItemsCache = {};
  }
}
