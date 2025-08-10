import { Component, inject, signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RegisterPayload } from '../../model/Register';
import { RegisterService } from '../../services/register/register.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-signup',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})

export class SignupComponent {
  private router = inject(Router);
  private registerService = inject(RegisterService);
  private toastr = inject(ToastrService)
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
      this.validateFields() ? this.registerUser() : null;
  }

  registerUser() {

    const signupForm: RegisterPayload = {
      userName : this.name(),
      email: this.email(),
      password: this.password(),
      mobileNum: this.mobileNum(),
      role: 'OWNER'
    }

    this.registerService.registerUser(signupForm).subscribe({
      next: (res) => {
        console.log("Register successful", res);
        if(res.data === 'Registered') {
          this.toastr.success('Please check your Email for verification for Login', 'Registered Successfully', {toastClass: 'custom-toastr custom-toastr-success'})
        } 
      },
      error: (err) => {
        console.log("Error in register", err);
      }
    })

  }

  validateFields(): boolean {

    if(this.email() == '') {
      this.toastr.warning('Please Enter Email', 'Invalid Fields', {toastClass: 'custom-toastr custom-toastr-warning'})
      return false;
    } if(this.password() == '') {
      this.toastr.warning('Please Enter Password', 'Invalid Fields', {toastClass: 'custom-toastr custom-toastr-warning'})
      return false;

    } if(this.name() == '') {
      this.toastr.warning('Please Enter Name', 'Invalid Fields', {toastClass: 'custom-toastr custom-toastr-warning'})
      return false;
    } if(this.mobileNum() == '') {
      this.toastr.warning('Please Enter Mobile Number', 'Invalid Fields', {toastClass: 'custom-toastr custom-toastr-warning'})
      return false;
    }
    return true;
  }

}
