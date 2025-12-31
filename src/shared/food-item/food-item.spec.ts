import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoodItem } from './food-item';

describe('FootItemComponent', () => {
  let component: FoodItem;
  let fixture: ComponentFixture<FoodItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FoodItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
