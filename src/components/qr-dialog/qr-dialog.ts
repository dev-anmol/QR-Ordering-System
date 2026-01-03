import {ChangeDetectionStrategy, Component, inject, input, InputSignal} from '@angular/core';
import {QRCodeComponent} from 'angularx-qrcode';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

interface QrDialogData {
  qrCode: string;
}

@Component({
  selector: 'app-qr-dialog',
  imports: [QRCodeComponent],
  templateUrl: './qr-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class QrDialog {

  readonly data = inject<QrDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<QrDialog>);

  closeDialog() {
    this.dialogRef.close();
  }
}
