import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  WritableSignal
} from '@angular/core';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {NavigationEnd, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {QrDialogComponent} from '../qr-dialog/qr-dialog.component';
import {Subscription} from 'rxjs';

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
    gsap.to(this.parallaxImage.nativeElement, {
      y: -50, // Moves image upwards when scrolling
      scale: 1, // Slight zoom effect
      ease: 'none',
      scrollTrigger: {
        trigger: this.parallaxSection.nativeElement,
        start: 'top bottom', // Starts before entering viewport
        end: 'bottom top', // Ends after leaving viewport
        scrub: true, // Makes animation smooth while scrolling
      },
    });

    // Parallax Effect on Text
    gsap.from(this.parallaxText.nativeElement, {
      opacity: 0,
      y: 50,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: this.parallaxSection.nativeElement,
        start: 'top 80%',
        toggleActions: 'play none none none',
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

  openQRCodeDialog() {
    this.dialog.open(QrDialogComponent, {
      data: {qrCode: this.qrCodeUrl}
    })
  }
}
