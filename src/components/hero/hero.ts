import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  signal,
  ViewChild,
  WritableSignal
} from '@angular/core';
// import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Subscription } from 'rxjs';
import { QrDialog } from '../qr-dialog/qr-dialog';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  imports: []
})
export class Hero implements AfterViewInit, OnInit {
  @ViewChild('parallaxSection') parallaxSection!: ElementRef;
  @ViewChild('parallaxImage') parallaxImage!: ElementRef;
  @ViewChild('parallaxText') parallaxText!: ElementRef;

  qrCodeUrl!: string;
  private routerSubscription!: Subscription;

  constructor(private router: Router) {
  }

  heroImg: WritableSignal<string> = signal('assets/desing.png');

  ngAfterViewInit() {
    this.initAnimations();
  }

  initAnimations() {
    ScrollTrigger.refresh();
    gsap.from(this.parallaxImage.nativeElement, {x:200, duration:0.8})
    gsap.to(this.parallaxImage.nativeElement, {
      scrollTrigger: {
        trigger: this.parallaxSection.nativeElement,
        start: 'top bottom', // Starts before entering viewport
        end: 'bottom top', // Ends after leaving viewport
        scrub: true,
      },
    });
  }

  ngOnInit() {
    const hotelId = '1';
    const tableId = '5';
    this.qrCodeUrl = `https://scaneatsqr.netlify.app/menu`

    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.initAnimations();
        setTimeout(() => {
          this.initAnimations();
        },100)
      }
    })
  }

  // openQRCodeDialog() {
  //   this.dialog.open(QrDialog, {
  //     data: {qrCode: this.qrCodeUrl}
  //   })
  // }
}
