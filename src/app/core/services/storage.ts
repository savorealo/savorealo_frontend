import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, switchMap, throwError } from 'rxjs';

/**
 * Servicio que provee la lógica de negocio para storage.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  /**
   * Propiedad para gestionar supabase.
   */
  private supabase = inject(SupabaseService);

  // userId eliminado — la foto se sube antes del signUp con path profile/{timestamp}
  /**
   * Método para upload avatar.
   */
  uploadAvatar(file: File) {
    const ext = file.name.split('.').pop();
    const path = `profile/${Date.now()}.${ext}`;

    return from(
      this.supabase.client.storage
        .from('users_storage')
        .upload(path, file, { upsert: true })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) return throwError(() => error);
        const { data: urlData } = this.supabase.client.storage
          .from('users_storage')
          .getPublicUrl(data.path);
        return [urlData.publicUrl];
      })
    );
  }
}