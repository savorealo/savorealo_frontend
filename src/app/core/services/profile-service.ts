import { inject, Injectable } from '@angular/core'
import { from, Observable, throwError } from 'rxjs'
import { map, catchError } from 'rxjs/operators'
import { SupabaseService } from '@core/services/supabase.service'
import { User } from '@core/models/user/User'

export interface UpdatePersonProfileInput {
	username?: string
	fullName?: string
	photoUrl?: string
	bio?: string
	location?: string
	birthDate?: string | Date
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
	private readonly sb = inject(SupabaseService)

	updateProfile(input: UpdatePersonProfileInput, _token?: string): Observable<User> {
		const updates: Record<string, unknown> = {}
		if (input.username  !== undefined) updates['username']   = input.username  || null
		if (input.fullName  !== undefined) updates['full_name']  = input.fullName  || null
		if (input.photoUrl  !== undefined) updates['photo_url']  = input.photoUrl  || null
		if (input.bio       !== undefined) updates['bio']        = input.bio       || null
		if (input.location  !== undefined) updates['location']   = input.location  || null
		if (input.birthDate !== undefined) updates['birth_date'] = input.birthDate || null

		if (Object.keys(updates).length === 0) {
			return throwError(() => new Error('Debes proporcionar al menos un campo a actualizar'))
		}

		const client = this.sb.client

		const promise = client.auth.getUser().then(async ({ data: { user } }) => {
			if (!user) throw new Error('No autenticado')

			const { data, error } = await client
				.from('person_profiles')
				.update(updates)
				.eq('user_id', user.id)
				.select('user_id, username, full_name, photo_url, bio, location, birth_date')
				.single()

			if (error) throw new Error(error.message)

			return {
				id:             user.id,
				email:          user.email ?? '',
				username:       data.username ?? '',
				fullName:       data.full_name ?? null,
				photo_url:      data.photo_url ?? null,
				bio:            data.bio ?? null,
				location:       data.location ?? null,
				birth_date:     data.birth_date ?? null,
				postsCount:     null,
				followersCount: null,
				followingCount: null,
			} as User
		})

		return from(promise).pipe(
			map(user => user),
			catchError(err => {
				console.error('[ProfileService] updateProfile error:', err)
				return throwError(() => err)
			}),
		)
	}
}
