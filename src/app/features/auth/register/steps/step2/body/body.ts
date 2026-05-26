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

  registerForm = input.required<FormGroup>()
  submitEvent = output()
  goBackEvent = output()

  readonly today = new Date()

  isInvalid(controlName: string): boolean {
    const control = this.registerForm().get(controlName)
    return !!(control?.invalid && control.touched)
  }

  onGoBack(){
    this.goBackEvent.emit()
  }

  onSubmit(){
    this.submitEvent.emit()
  }
}
