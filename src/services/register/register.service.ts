import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/env';
import { RegisterPayload } from '../../model/Register';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  private http = inject(HttpClient);
  headers = new HttpHeaders().set('Content-Type', 'application/json');


  registerUser(payload: RegisterPayload) : Observable<any> {
    return this.http.post(`${environment.apiUrl}/register`, payload, {headers: this.headers})
  }

}
