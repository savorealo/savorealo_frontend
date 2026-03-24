import { NgClass } from '@angular/common';
import { Component, inject, input, output } from '@angular/core'
import { FormGroup, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { Message } from "primeng/message";
import { Button } from "primeng/button";
import { Password } from "primeng/password";
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-body-step1',
  imports: [
    NgClass,
    Message,
    Button,
    Password,
    InputTextModule,
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './body.html',
  styleUrl: './body.scss',
})
export class Body {
  private messageService = inject(MessageService)

  registerForm = input.required<FormGroup>()
  submitEvent = output()

  onSubmit() {
    if(this.isStepValid()){
      this.submitEvent.emit() 
    }else{
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fill all fields' });
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.registerForm().get(controlName)
    return !!(control?.invalid && control.touched)
  }

  isStepValid(){
    if(
      this.registerForm().get('email')?.valid &&
      this.registerForm().get('password')?.valid
    ){
      return true
    }else return false
  }
}
