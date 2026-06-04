import { Component, inject, output } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { NgClass } from '@angular/common';
import { PasswordModule } from 'primeng/password';
import { LoginUser } from '@core/models/user/User';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/**
 * Clase de utilidad para login.
 */
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
    PasswordModule,
    TranslatePipe
  ],

  templateUrl: './login.html',
})
export class Login {
  /**
   * Propiedad para gestionar form builder.
   */
  private formBuilder = inject(FormBuilder)
  /**
   * Propiedad para gestionar form submitted.
   */
  formSubmitted: boolean = false;
  /**
   * Propiedad para gestionar to registere event.
   */
  toRegistereEvent = output<boolean>()
  /**
   * Propiedad para gestionar evento de login enviar.
   */
  onLoginSubmit = output<LoginUser>()
  /**
   * Propiedad para gestionar evento de google login.
   */
  onGoogleLogin = output<void>()


  /**
   * Propiedad para gestionar login form.
   */
  loginForm: FormGroup = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  })


  /**
   * Método para to register.
   */
  toRegister($event: boolean) {
    this.toRegistereEvent.emit($event)
  }

  /**
   * Método para es o está invalid.
   */
  isInvalid(controlName: string) {
    const control = this.loginForm.get(controlName);
    return control?.invalid && (control.touched || this.formSubmitted);
  }

  /**
   * Método para evento de enviar.
   */
  onSubmit() {
    this.formSubmitted = true;
    if (this.loginForm.valid) {
        this.onLoginSubmit.emit({
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      })
      this.loginForm.reset();
      this.formSubmitted = false;
    }
  }

  /**
   * Método para login with google.
   */
  loginWithGoogle() {
    this.onGoogleLogin.emit();
  }
}
