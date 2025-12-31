import {Component, Inject, OnInit} from '@angular/core';
// import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';


@Component({
  selector: 'app-qr-dialog',
  imports: [],
  templateUrl: './qr-dialog.html',
})
export class QrDialog implements OnInit{
  // constructor(private dialogRef: MatDialogRef<QrDialog>,
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
