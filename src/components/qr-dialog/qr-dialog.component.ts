import {Component, Inject, OnInit} from '@angular/core';
// import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { QRCodeComponent } from 'angularx-qrcode';


@Component({
  selector: 'app-qr-dialog',
  imports: [QRCodeComponent],
  templateUrl: './qr-dialog.component.html',
  styleUrl: './qr-dialog.component.css'
})
export class QrDialogComponent implements OnInit{
  // constructor(private dialogRef: MatDialogRef<QrDialogComponent>,
  // @Inject(MAT_DIALOG_DATA) public data: {qrCode : string}
  // ) {}

  ngOnInit() {
    // console.log('QR Code Data Received:', this.data.qrCode);
  }

  closeDialog() {
    console.log("called closed");
    // this.dialogRef.close();
  }

}
