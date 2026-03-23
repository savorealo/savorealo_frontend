import { Component, inject, output } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    MessageModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    ReactiveFormsModule,
    InputTextModule,
    NgClass
  ],

  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private formBuilder = inject(FormBuilder)
  formSubmitted: boolean = false;
  toRegistereEvent = output<boolean>()

  loginForm: FormGroup = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  })


  toRegister($event: boolean) {
    this.toRegistereEvent.emit($event)
  }

  isInvalid(controlName: string) {
    //const control = this.loginForm.get(controlName);
    //return control?.invalid && (control.touched || this.formSubmitted);
    console.log(controlName)
    return true
  }

  onSubmit() {
    this.formSubmitted = true;
    console.log("click")
    if (this.loginForm.valid) {
      console.log(this.loginForm.value)
      this.loginForm.reset();
      this.formSubmitted = false;
    }
  }
}
