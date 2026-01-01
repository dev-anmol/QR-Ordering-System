import {Component, signal, WritableSignal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-hero-secondary',
  imports: [NgOptimizedImage],
  templateUrl: './hero-secondary.html',
})
export class HeroSecondary {
  heroImgFirst: WritableSignal<string> = signal('assets/heroqr.jpg');
  heroImgSecond: WritableSignal<string> = signal('assets/heroone.jpg')

}
