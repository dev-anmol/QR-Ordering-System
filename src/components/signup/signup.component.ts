import { Component, inject, signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { RegisterService } from '../../services/register/register.service';
import { RegisterPayload } from '../../model/Register';

@Component({
  selector: 'app-signup',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  private router = inject(Router);
  private registerService = inject(RegisterService);

  name : WritableSignal<string> = signal('');
  email : WritableSignal<string> = signal('');
  password : WritableSignal<string> = signal('');
  mobileNum : WritableSignal<string> = signal('');

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

  handleMobileNum(event: Event) {
    const inputVal = (event.target as HTMLInputElement).value;
    this.mobileNum.set(inputVal);
  }

  handleSubmit(event : Event) {
      event.preventDefault();
      const signupForm: RegisterPayload = {
        userName : this.name(),
        email: this.email(),
        password: this.password(),
        mobileNum: this.mobileNum(),
        role: 'OWNER'
      }
      console.log(signupForm);
      this.registerService.registerUser(signupForm).subscribe({
        next: (res) => {
          console.log("Register successful", res);
        },
        error: (err) => {
          console.log("Error in register", err);
        }
      })
  }




}
