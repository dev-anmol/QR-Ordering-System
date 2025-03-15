import { Component, Input, OnInit, WritableSignal } from '@angular/core';
import { testimonialFormat } from '../../model/testimonial';

@Component({
  selector: 'app-testimonial',
  standalone: true,
  templateUrl: './testimonial.component.html',
  styleUrl: './testimonial.component.css'
})
export class TestimonialComponent {
  @Input() testimonialsData!: WritableSignal<testimonialFormat[]>;

  get testimonialList(): testimonialFormat[] {
    return this.testimonialsData();
  }
}
