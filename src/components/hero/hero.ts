import {AfterViewInit, Component, OnInit, signal, WritableSignal} from '@angular/core';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {NgOptimizedImage} from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import {NgxShineBorderComponent} from '@omnedia/ngx-shine-border';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  imports: [NgOptimizedImage, NzButtonModule, NgxShineBorderComponent]
})
export class Hero implements AfterViewInit, OnInit {
  qrCodeUrl!: string;
  heroImg: WritableSignal<string> = signal('assets/desing.png');
  ngAfterViewInit() {
  }
  ngOnInit() {
    const hotelId = '1';
    const tableId = '5';
    this.qrCodeUrl = `https://scaneatsqr.netlify.app/menu`
  }

  onQrCode() {
    console.log("triggered")
  }
}
