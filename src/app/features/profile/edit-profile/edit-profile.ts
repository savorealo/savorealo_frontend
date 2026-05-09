import {
  Component,
  inject,
  signal,
  computed,
  output,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthStore } from '@core/store/auth.store';
import { UpdatePersonProfileInput } from '@core/services/user/profile-service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: "./edit-profile.html",
  styleUrl: "./edit-profile.scss"
})
export class EditProfileComponent implements OnInit {

  /** Emite false cuando el usuario cierra o guarda — el padre cierra el dialog */
  readonly visibleChange = output<boolean>();

  authStore = inject(AuthStore);

  // Estado del formulario como signal
  form = signal<UpdatePersonProfileInput>({
    username:  '',
    fullName:  '',
    photoUrl:  '',
    bio:       '',
    location:  '',
    birthDate: '',
  });

  // Snapshot inicial para detectar cambios
  private initial = signal<UpdatePersonProfileInput>({});

  success = signal(false);

  bioLength = computed(() => (this.form().bio ?? '').length);

  isDirty = computed(() => {
    const f = this.form();
    const i = this.initial();
    return (Object.keys(f) as (keyof UpdatePersonProfileInput)[])
      .some(key => f[key] !== i[key]);
  });

  ngOnInit(): void {
    const p = this.authStore.profile();
    if (!p) return;

    const initial: UpdatePersonProfileInput = {
      username:  p.username   ?? '',
      fullName:  p.fullName   ?? '',
      photoUrl:  p.photo_url  ?? '',
      bio:       p.bio        ?? '',
      location:  p.location   ?? '',
      birthDate: p.birth_date
        ? new Date(p.birth_date).toISOString().split('T')[0]
        : '',
    };

    this.form.set({ ...initial });
    this.initial.set({ ...initial });
  }

  /** Actualiza un campo concreto del formulario */
  patch(partial: Partial<UpdatePersonProfileInput>): void {
    this.form.update(f => ({ ...f, ...partial }));
    this.success.set(false);
  }

  submit(): void {
    if (!this.isDirty()) return;

    // Solo mandamos los campos que han cambiado respecto al estado inicial
    const diff: UpdatePersonProfileInput = {};
    const f = this.form();
    const i = this.initial();

    (Object.keys(f) as (keyof UpdatePersonProfileInput)[]).forEach(key => {
      if (f[key] !== i[key]) (diff as any)[key] = f[key] || undefined;
    });

    this.authStore.updateProfile(diff).subscribe({
      next: () => {
        this.success.set(true);
        this.initial.set({ ...this.form() }); // reset dirty check
        // Cerramos el dialog tras 1s para que el usuario vea el mensaje de éxito
        setTimeout(() => this.visibleChange.emit(false), 1000);
      },
      error: () => {} // el error ya está en authStore.error()
    });
  }

  onClose(): void {
    this.visibleChange.emit(false);
  }
}
