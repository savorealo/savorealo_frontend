import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, switchMap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private supabase = inject(SupabaseService);

  // userId eliminado — la foto se sube antes del signUp con path profile/{timestamp}
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