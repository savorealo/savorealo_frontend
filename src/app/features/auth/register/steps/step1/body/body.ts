import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core'
import { FormGroup, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { Message } from "primeng/message";
import { ButtonDirective} from "primeng/button";
import { Password } from "primeng/password";
import { InputTextModule } from 'primeng/inputtext';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-body-step1',
  imports: [
    NgClass,
    Message,
    Password,
    InputTextModule,
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
    ButtonDirective,
    TranslatePipe
],
  templateUrl: './body.html',
  styleUrl: './body.scss',
})
export class Body {

  registerForm = input.required<FormGroup>()
  submitEvent = output()

  onSubmit() {
    if(this.isStepValid()){
      this.submitEvent.emit() 
    }else{
      this.registerForm().markAllAsTouched()
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.registerForm().get(controlName)
    return !!(control?.invalid && control.touched)
  }

  isStepValid(){
    if(
      this.registerForm().get('email')?.valid &&
      this.registerForm().get('password')?.valid &&
      this.registerForm().get('username')?.valid
    ){
      return true
    }else return false
  }
}
