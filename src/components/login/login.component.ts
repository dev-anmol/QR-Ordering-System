import { Component, inject, signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private router = inject(Router);

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
      const signupForm = {
        email: this.email(),
        password: this.password()
      }
      console.log(signupForm);
      this.email.update(prev => prev = '')
      this.password.update(prev => prev = '')
  }
}
