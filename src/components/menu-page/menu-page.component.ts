import {Component, DestroyRef, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {FoodItemService} from '../../shared/services/foodItems/food-item.service';
import {FoodItemComponent} from '../../shared/food-item/food-item.component';
import {MenuFooterComponent} from '../menu-footer/menu-footer.component';
import {foodInterface} from '../../model/food.interface';
import {Store} from '@ngrx/store';
import {AppState} from '../../state/app.state';
import {addToCart} from '../../state/cart/cart.actions';
import {Router} from '@angular/router';
import {UicartService} from '../../shared/services/uicart.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {OverlayContainer, ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-menu-page',
  imports: [
    FoodItemComponent,
    MenuFooterComponent,
  ],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.css'
})
export class MenuPageComponent implements OnInit, OnDestroy {

  private foodApi = inject(FoodItemService);
  private uiCart = inject(UicartService);
  private destroyRef = inject(DestroyRef);
  // private toastr = inject(ToastrService);
  private overlayContainer = inject(OverlayContainer);
  foodItem = signal<foodInterface[]>([]);
  isLoading = signal(true);
  hasError = signal(false);

  constructor(private toastr: ToastrService, private store: Store<AppState>, private route: Router) {
    this.overlayContainer.getContainerElement();
  }

  ngOnInit() {
    this.foodApi.getFoodItems().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    this.uiCart.setShowCart(true);
  }

  addItemToCart(product: foodInterface) {
    this.store.dispatch(addToCart({product}));
    this.toastr.success("Item added to Cart!");
  }

  ngOnDestroy() {
    this.uiCart.setShowCart(false);
  }
}
