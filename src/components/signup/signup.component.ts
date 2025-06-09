import { Component, inject, signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  private router = inject(Router);

  name : WritableSignal<string> = signal('');
  email : WritableSignal<string> = signal('');
  password : WritableSignal<string> = signal('');

  handleName(event: Event) {
    const inputVal = (event.target as HTMLInputElement).value;
    this.name.set(inputVal);
  }

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
        name : this.name(),
        email: this.email(),
        password: this.password()
      }
      console.log(signupForm);
      this.email.update(prev => prev = '')
      this.name.update(prev => prev = '')
      this.password.update(prev => prev = '')
      this.router.navigateByUrl('/home')
  }


}
