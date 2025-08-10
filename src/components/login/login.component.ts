import { Component, inject, signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../services/login/login.service';
import { LoginPayload } from '../../model/login';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private router = inject(Router);
  private loginService = inject(LoginService);

  email : WritableSignal<string> = signal('');
  password : WritableSignal<string> = signal('');

  handleEmail(event: Event) {
    const inputVal = (event.target as HTMLInputElement).value;
    this.email.set(inputVal); 
  }

  handlePassword(event: Event) {
    const inputVal = (event.target as HTMLInputElement).value;
    this.password.set(inputVal);
  }

  handleSubmit(event : Event) {
    event.preventDefault();
      const data: LoginPayload = {
        email: this.email(),
        password: this.password()
      }
      console.log(data);
      this.loginService.loginUser(data).subscribe({
        next: (res) => {
          console.log("Login successful", res);
          this.router.navigateByUrl('/home')
        },
        error: (err) => {
          console.log("Error in login", err);
        }
      })
  }
}
