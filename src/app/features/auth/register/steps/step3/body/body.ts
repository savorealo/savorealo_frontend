import { Component, input, output, OnDestroy } from '@angular/core'
import { FormGroup, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { Button } from "primeng/button";
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-body-step3',
  imports: [
    Button,
    InputTextModule,
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
    ToastModule,
    DatePickerModule,
    TextareaModule,
  ],
  providers: [MessageService],
  templateUrl: './body.html',
  styleUrl: './body.scss',
})
export class Body implements OnDestroy {

  registerForm = input.required<FormGroup>();
  submitEvent = output();
  goBackEvent = output();

  // Solo para el preview en el template
  previewUrl: string | null = null;
  private previewObjectUrl: string | null = null;

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.clearPhoto();
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error('Formato no permitido. Usa JPG, PNG o WEBP.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      console.error('La imagen supera los 2 MB.');
      return;
    }

    // Preview solo para mostrar en el template
    this.previewObjectUrl = URL.createObjectURL(file);
    this.previewUrl = this.previewObjectUrl;

    // El File crudo va al formControl — el padre lo lee cuando hace submit
    this.registerForm().get('photo')?.setValue(file);
  }

  clearPhoto() {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.previewUrl = null;
    this.registerForm().get('photo')?.setValue(null);
  }

  onSubmit() {
    this.submitEvent.emit();
  }

  onGoBack() {
    this.goBackEvent.emit();
  }

  ngOnDestroy() {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
    }
  }
}