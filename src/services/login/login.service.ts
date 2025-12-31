import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/env';
import { LoginPayload } from '../../model/login';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})


export class LoginService {

  constructor() { }

  private http = inject(HttpClient);
  headers = new HttpHeaders().set('Content-Type', 'application/json');

  loginUser(payload: LoginPayload) : Observable<any> {
    // return this.http.post(`${environment.apiUrl}/login`, payload, {headers: this.headers})
    return new Observable(observer => observer.next(true))
  }
}
