import { Component, inject, signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoginPayload } from '../../model/login';
import { LoginService } from '../../services/login/login.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})


export class LoginComponent {
  private router = inject(Router);
  private loginService = inject(LoginService);
  private toastr = inject(ToastrService);

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
      this.validateFields() ? this.loginUser() : null;
  }

  loginUser() {

    const data: LoginPayload = {
      email: this.email(),
      password: this.password()
    }

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

  
  validateFields(): boolean {
    if(this.email() == '' || this.password() == '') {
      this.toastr.warning('Please enter email and password', 'Invalid Fields', { toastClass: 'custom-toastr custom-toastr-warning' });
      return false;
    }
    return true;
  }


}