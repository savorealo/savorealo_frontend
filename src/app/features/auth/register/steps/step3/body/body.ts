import { Component, input, output } from '@angular/core'
import { FormGroup, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { Button } from "primeng/button";
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-body-step3',
imports: [
    Button,
    InputTextModule,
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
    ToastModule,
    DatePickerModule,
    ReactiveFormsModule,
    TextareaModule,
  ],
  providers: [MessageService],  templateUrl: './body.html',
  styleUrl: './body.scss',
})
export class Body {

  registerForm = input.required<FormGroup>()
  submitEvent = output()
  goBackEvent = output()

  onPhotoSelected($event: any) {
    console.log($event)
  }

  onSubmit(){
    this.submitEvent.emit()
  }

  onGoBack(){
    this.goBackEvent.emit()
  }
}
