import { Component, inject, output } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { NgClass } from '@angular/common';
import { PasswordModule } from 'primeng/password';
import { LoginUser } from '@core/models/user/User';

@Component({
  selector: 'app-login',
  imports: [
    MessageModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    ReactiveFormsModule,
    InputTextModule,
    NgClass,
    PasswordModule
  ],

  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private formBuilder = inject(FormBuilder)
  formSubmitted: boolean = false;
  toRegistereEvent = output<boolean>()
  onLoginSubmit = output<LoginUser>()


  loginForm: FormGroup = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  })


  toRegister($event: boolean) {
    this.toRegistereEvent.emit($event)
  }

  isInvalid(controlName: string) {
    const control = this.loginForm.get(controlName);
    return control?.invalid && (control.touched || this.formSubmitted);
  }

  onSubmit() {
    this.formSubmitted = true;
    if (this.loginForm.valid) {
      this.loginForm.reset();
      this.formSubmitted = false;
      this.onLoginSubmit.emit({
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      })
    }
  }
}
