import { Component, AfterViewInit, ElementRef, ViewChild, signal, WritableSignal } from '@angular/core';
import gsap from 'gsap';
import { testimonialFormat } from '../../model/testimonial';
import { TestimonialComponent } from '../../shared/testimonial/testimonial.component';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [TestimonialComponent],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.css'
})
export class TestimonialsComponent{

  testimonialsData: WritableSignal<testimonialFormat[]> = signal([
    { text: "As a seasoned designer always on the lookout for innovative tools, Framer.com instantly grabbed my attention.", imageSrc: 'assets/avatar-1.png', name: "Jamie Rivera", username: "@jamietechguru00", id: 0 },
    { text: "Our team's productivity has skyrocketed since we started using this tool.", imageSrc: 'assets/avatar-2.png', name: "Josh Smith", username: "@jjsmith", id: 1 },
    { text: "This app has completely transformed how I manage my projects and deadlines.", imageSrc: 'assets/avatar-3.png', name: "Morgan Lee", username: "@morganleewhiz", id: 2 },
    { text: "I was amazed at how quickly we were able to integrate this app into our workflow.", imageSrc: 'assets/avatar-4.png', name: "Casey Jordan", username: "@caseyj", id: 3 },
    { text: "Planning and executing events has never been easier. This app helps me keep track of all the moving parts, ensuring nothing slips through the cracks.", imageSrc: 'assets/avatar-5.png', name: "Taylor Kim", username: "@taylorkimm", id: 4 },
    { text: "The customizability and integration capabilities of this app are top-notch.", imageSrc: 'assets/avatar-6.png', name: "Riley Smith", username: "@rileysmith1", id: 5 },
    { text: "Adopting this app for our team has streamlined our project management and improved communication across the board.", imageSrc: 'assets/avatar-7.png', name: "Jordan Patels", username: "@jpatelsdesign", id: 6 },
    { text: "With this app, we can easily assign tasks, track progress, and manage documents all in one place.", imageSrc: 'assets/avatar-8.png', name: "Sam Dawson", username: "@dawsontechtips", id: 7 },
    { text: "Its user-friendly interface and robust features support our diverse needs.", imageSrc: 'assets/avatar-9.png', name: "Casey Harper", username: "@casey09", id: 8 }
  ]);

  firstRow: WritableSignal<testimonialFormat[]> = signal(this.testimonialsData().slice(0, 3));
  secondRow: WritableSignal<testimonialFormat[]> = signal(this.testimonialsData().slice(3, 6));
  thirdRow: WritableSignal<testimonialFormat[]> = signal(this.testimonialsData().slice(6, 9));

}
