import { Component } from '@angular/core';
import {Footer} from "../footer/footer";
import {Header} from "../header/header";
import {Hero} from "../hero/hero";
import {HeroSecondary} from "../hero-secondary/hero-secondary";
import {PricingComponent} from "../pricing/pricing.component";
import {TestimonialsComponent} from "../testimonials/testimonials.component";

@Component({
  selector: 'app-landing-page',
    imports: [
        Footer,
        Hero,
        HeroSecondary,
        PricingComponent,
        TestimonialsComponent
    ],
  templateUrl: './landing-page.html',
})
export class LandingPage {

}
