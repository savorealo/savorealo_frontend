import { inject, Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { POST_MEDIA_REPOSITORY } from '@core/repositories/tokens/repository.tokens'

@Injectable({ providedIn: 'root' })
export class PostMediaService {
	private readonly repo = inject(POST_MEDIA_REPOSITORY)

	uploadPostImage(file: File): Observable<string> {
		const extension = file.name.split('.').pop() || 'jpg'
		const path = `posts/${crypto.randomUUID()}.${extension}`
		return this.repo.uploadImage(path, file)
	}
}
