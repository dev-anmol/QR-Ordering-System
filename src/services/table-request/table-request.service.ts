import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/env';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TableRequestService {
  private http = inject(HttpClient);
  private orderUrl = environment.orderUrl;

  createRequest(type: 'CALL_WAITER' | 'WATER' | 'BILL'): Observable<any> {
    return this.http.post<any>(`${this.orderUrl}/table-request/create?type=${type}`, {});
  }
}
