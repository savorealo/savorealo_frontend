import { Component, input, output, OnDestroy } from '@angular/core'
import { FormGroup, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { ButtonDirective } from "primeng/button";
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/**
 * Variable o constante para m a x s i z e b y t e s.
 */
const MAX_SIZE_BYTES = 2 * 1024 * 1024;
/**
 * Variable o constante para a l l o w e d t y p e s.
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Clase de utilidad para body.
 */
@Component({
  selector: 'app-body-step3',
  imports: [
    InputTextModule,
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
    ToastModule,
    DatePickerModule,
    TextareaModule,
    ButtonDirective,
    TranslatePipe,
],
  providers: [MessageService],
  templateUrl: './body.html',
  styleUrl: './body.scss',
})
export class Body implements OnDestroy {

  /**
   * Propiedad para gestionar register form.
   */
  registerForm = input.required<FormGroup>();
  /**
   * Propiedad para gestionar enviar event.
   */
  submitEvent = output();
  /**
   * Propiedad para gestionar go back event.
   */
  goBackEvent = output();

  // Solo para el preview en el template
  /**
   * Propiedad para gestionar preview enlace.
   */
  previewUrl: string | null = null;
  /**
   * Propiedad para gestionar preview object enlace.
   */
  private previewObjectUrl: string | null = null;

  /**
   * Método para evento de foto selected.
   */
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

  /**
   * Método para limpiar foto.
   */
  clearPhoto() {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.previewUrl = null;
    this.registerForm().get('photo')?.setValue(null);
  }

  /**
   * Método para evento de enviar.
   */
  onSubmit() {
    this.submitEvent.emit();
  }

  /**
   * Método para evento de go back.
   */
  onGoBack() {
    this.goBackEvent.emit();
  }

  /**
   * Método de ciclo de vida de Angular que se ejecuta al destruir el componente para liberar recursos.
   */
  ngOnDestroy() {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
    }
  }
}