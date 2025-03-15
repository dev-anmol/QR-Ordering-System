import { Component } from '@angular/core';
import {FooterComponent} from "../footer/footer.component";
import {HeaderComponent} from "../header/header.component";
import {HeroComponent} from "../hero/hero.component";
import {HeroSecondaryComponent} from "../hero-secondary/hero-secondary.component";
import {PricingComponent} from "../pricing/pricing.component";
import {TestimonialsComponent} from "../testimonials/testimonials.component";

@Component({
  selector: 'app-landing-page',
    imports: [
        FooterComponent,
        HeroComponent,
        HeroSecondaryComponent,
        PricingComponent,
        TestimonialsComponent
    ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {

}
