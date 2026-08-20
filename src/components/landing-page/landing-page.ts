import { Component } from '@angular/core';
import {Footer} from "../footer/footer";
import {Header} from "../header/header";
import {Hero} from "../hero/hero";
import {HeroSecondary} from "../hero-secondary/hero-secondary";
import {TestimonialsComponent} from "../testimonials/testimonials.component";

@Component({
  selector: 'app-landing-page',
    imports: [
        Footer,
        Hero,
        HeroSecondary,
        TestimonialsComponent
    ],
  templateUrl: './landing-page.html',
})
export class LandingPage {

}
