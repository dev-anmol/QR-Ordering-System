import { Injectable, signal } from '@angular/core';

export interface AlertData {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  alertState = signal<AlertData | null>(null);

  show(title: string, message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    this.alertState.set({ title, message, type });
  }

  close() {
    this.alertState.set(null);
  }
}
