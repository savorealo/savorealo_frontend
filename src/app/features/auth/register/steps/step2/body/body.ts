import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core'
import { FormGroup, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { Message } from "primeng/message";
import { ButtonDirective } from "primeng/button";
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/**
 * Clase de utilidad para body.
 */
@Component({
  selector: 'app-body-step2',
  imports: [
    NgClass,
    Message,
    InputTextModule,
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
    ToastModule,
    DatePickerModule,
    TextareaModule,
    ButtonDirective,
    TranslatePipe
  ],
    providers: [MessageService],
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
   * Propiedad para gestionar go back event.
   */
  goBackEvent = output()

  /**
   * Propiedad para gestionar today.
   */
  readonly today = new Date()

  /**
   * Método para es o está invalid.
   */
  isInvalid(controlName: string): boolean {
    const control = this.registerForm().get(controlName)
    return !!(control?.invalid && control.touched)
  }

  /**
   * Método para evento de go back.
   */
  onGoBack(){
    this.goBackEvent.emit()
  }

  /**
   * Método para evento de enviar.
   */
  onSubmit(){
    this.submitEvent.emit()
  }
}
