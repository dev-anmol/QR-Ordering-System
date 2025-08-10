import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  signal,
  ViewChild,
  WritableSignal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Subscription } from 'rxjs';
import { QrDialogComponent } from '../qr-dialog/qr-dialog.component';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
  imports: []
})
export class HeroComponent implements AfterViewInit, OnInit {
  @ViewChild('parallaxSection') parallaxSection!: ElementRef;
  @ViewChild('parallaxImage') parallaxImage!: ElementRef;
  @ViewChild('parallaxText') parallaxText!: ElementRef;

  qrCodeUrl!: string;
  private routerSubscription!: Subscription;

  constructor(private router: Router, private dialog: MatDialog) {
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

    // Parallax Effect on Text
    // gsap.set(this.parallaxText.nativeElement, {opacity: 0, y : 50});

    // Immediate animation for initial load
    // gsap.to(this.parallaxText.nativeElement, {
    //   opacity: 1,
    //   y: 0,
    //   duration: 1.5,
    //   ease: 'power2.out',
    // });
    
    // gsap.to(this.parallaxText.nativeElement, {
    //   opacity: 1,
    //   y: 0,
    //   duration: 1.5,
    //   ease: 'power2.out',
    //   scrollTrigger: {
    //     trigger: this.parallaxSection.nativeElement,
    //     toggleActions: 'play none none none',
    //     immediateRender: true,
    //     once: true
    //   },
    // });

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

  openQRCodeDialog() {
    this.dialog.open(QrDialogComponent, {
      data: {qrCode: this.qrCodeUrl}
    })
  }
}
