import { inject, Injectable } from '@angular/core'
import { from, map, Observable, switchMap, throwError } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import type { IPostMediaRepository } from './post-media-repository'

/**
 * Repositorio de datos para postmediasupabase.
 */
@Injectable({ providedIn: 'root' })
export class PostMediaSupabaseRepository implements IPostMediaRepository {
	/**
	 * Propiedad para gestionar supabase.
	 */
	private readonly supabase = inject(SupabaseService)

	/**
	 * Método para upload imagen.
	 */
	uploadImage(path: string, file: File): Observable<string> {
		return from(
			this.supabase.client.storage
				.from('post_media')
				.upload(path, file, { upsert: false }),
		).pipe(
			switchMap(({ data, error }) => {
				if (error) return throwError(() => error)
				const { data: urlData } = this.supabase.client.storage
					.from('post_media')
					.getPublicUrl(data.path)
				return [urlData.publicUrl]
			}),
			map(url => url),
		)
	}
}
