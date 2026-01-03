import {ChangeDetectionStrategy, Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {NgxShineBorderComponent} from '@omnedia/ngx-shine-border';
import {MatDialog} from '@angular/material/dialog';
import QrDialog from '../qr-dialog/qr-dialog';


@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  imports: [NgOptimizedImage, NgxShineBorderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Hero implements OnInit {


  qrCodeUrl: WritableSignal<string> = signal('');
  heroImg: WritableSignal<string> = signal('assets/desing.png');
  readonly dialog = inject(MatDialog);


  ngOnInit() {
    this.qrCodeUrl.set("https://scaneatsqr.netlify.app/menu")
  }

  openDialog() {
    const dialogRef = this.dialog.open(QrDialog, {
      data: {
        qrCode: this.qrCodeUrl(),
      },
      panelClass: 'qr-dialog-panel', // optional
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe(result => {
    });
  }



  protected readonly open = open;
}
