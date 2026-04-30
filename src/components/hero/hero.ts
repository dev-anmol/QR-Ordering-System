import {ChangeDetectionStrategy, Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {NgxShineBorderComponent} from '@omnedia/ngx-shine-border';
import {Router} from '@angular/router';


@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  imports: [NgOptimizedImage, NgxShineBorderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Hero implements OnInit {


  heroImg: WritableSignal<string> = signal('assets/desing.png');
  private router = inject(Router);


  ngOnInit() {}

  getStarted() {
    this.router.navigate(['/menu']);
  }
}
