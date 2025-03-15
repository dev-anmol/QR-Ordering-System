import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroSecondaryComponent } from './hero-secondary.component';

describe('HeroSecondaryComponent', () => {
  let component: HeroSecondaryComponent;
  let fixture: ComponentFixture<HeroSecondaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroSecondaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroSecondaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
