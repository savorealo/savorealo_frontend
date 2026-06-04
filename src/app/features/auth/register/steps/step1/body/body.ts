import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core'
import { FormGroup, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { Message } from "primeng/message";
import { ButtonDirective} from "primeng/button";
import { Password } from "primeng/password";
import { InputTextModule } from 'primeng/inputtext';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/**
 * Clase de utilidad para body.
 */
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

  /**
   * Propiedad para gestionar register form.
   */
  registerForm = input.required<FormGroup>()
  /**
   * Propiedad para gestionar enviar event.
   */
  submitEvent = output()

  /**
   * Método para evento de enviar.
   */
  onSubmit() {
    if(this.isStepValid()){
      this.submitEvent.emit() 
    }else{
      this.registerForm().markAllAsTouched()
    }
  }

  /**
   * Método para es o está invalid.
   */
  isInvalid(controlName: string): boolean {
    const control = this.registerForm().get(controlName)
    return !!(control?.invalid && control.touched)
  }

  /**
   * Método para es o está step valid.
   */
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
