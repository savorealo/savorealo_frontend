import { inject, Injectable } from '@angular/core'
import { from, map, Observable, switchMap, throwError } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'

@Injectable({ providedIn: 'root' })
export class PostMediaService {
	private readonly supabase = inject(SupabaseService)

	uploadPostImage(file: File): Observable<string> {
		const extension = file.name.split('.').pop() || 'jpg'
		const path = `posts/${crypto.randomUUID()}.${extension}`

		return from(
			this.supabase.client.storage
				.from('posts_storage')
				.upload(path, file, { upsert: false }),
		).pipe(
			switchMap(({ data, error }) => {
				if (error) return throwError(() => error)
				const { data: urlData } = this.supabase.client.storage
					.from('posts_storage')
					.getPublicUrl(data.path)
				return [urlData.publicUrl]
			}),
			map(url => url),
		)
	}
}
