import { inject, Injectable } from '@angular/core'
import { Apollo } from 'apollo-angular'
import { from, Observable, throwError } from 'rxjs'
import { map, catchError } from 'rxjs/operators'
import { UPDATE_PROFILE_MUTATION } from '@graphql/feed.mutations'
import { User } from '@core/models/user/User'

export interface UpdatePersonProfileInput {
	username?: string
	/** Nombre visible (canónico). Antes era `fullName`. */
	displayName?: string
	/** URL del avatar (canónico). Antes era `photoUrl`. */
	avatarUrl?: string
	bio?: string
	location?: string
	birthDate?: string | Date
	/** Solo BUSINESS. Alias de displayName. */
	businessName?: string
	specialty?: string
	phone?: string
	website?: string

	/** @deprecated alias legacy mantenido para no romper formularios existentes. */
	fullName?: string
	/** @deprecated alias legacy mantenido para no romper formularios existentes. */
	photoUrl?: string
}

interface GqlUpdateProfileResult {
	id: string
	username: string | null
	display_name: string | null
	avatar_url: string | null
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
	private readonly apollo = inject(Apollo)

	updateProfile(input: UpdatePersonProfileInput, _token?: string): Observable<User> {
		const variables = this.buildVariables(input)

		if (Object.keys(variables).length === 0) {
			return throwError(() => new Error('Debes proporcionar al menos un campo a actualizar'))
		}

		return from(
			this.apollo.mutate<{ updateProfile: GqlUpdateProfileResult }>({
				mutation: UPDATE_PROFILE_MUTATION,
				variables,
			}).toPromise(),
		).pipe(
			map(res => {
				const updated = res?.data?.updateProfile
				if (!updated) throw new Error('No se pudo actualizar el perfil')

				// El backend ahora resuelve `avatar_url` de forma consistente.
				// Invalidamos el User cacheado para que feed/post.author/perfil
				// vuelvan a leer la misma fuente tras editar el perfil.
				this.evictUserFromCache(updated.id)

				return {
					id:             updated.id,
					email:          '',
					username:       updated.username ?? '',
					fullName:       updated.display_name ?? null,
					photo_url:      updated.avatar_url ?? null,
					bio:            input.bio ?? null,
					location:       input.location ?? null,
					birth_date:     this.normalizeBirthDate(input.birthDate),
					postsCount:     null,
					followersCount: null,
					followingCount: null,
				} as User
			}),
			catchError(err => {
				console.error('[ProfileService] updateProfile error:', err)
				return throwError(() => err)
			}),
		)
	}

	private evictUserFromCache(userId: string): void {
		try {
			const cache = this.apollo.client.cache
			cache.evict({ id: cache.identify({ __typename: 'users', id: userId }) })
			cache.evict({ id: 'ROOT_QUERY', fieldName: 'user' })
			cache.gc()
		} catch { /* cache best-effort */ }
	}

	private buildVariables(input: UpdatePersonProfileInput): Record<string, unknown> {
		const vars: Record<string, unknown> = {}

		if (input.username     !== undefined) vars['username']      = input.username || null
		if (input.displayName  !== undefined) vars['display_name']  = input.displayName || null
		else if (input.fullName !== undefined) vars['display_name'] = input.fullName || null

		if (input.avatarUrl    !== undefined) vars['avatar_url']    = input.avatarUrl || null
		else if (input.photoUrl !== undefined) vars['avatar_url']   = input.photoUrl || null

		if (input.bio          !== undefined) vars['bio']           = input.bio || null
		if (input.location     !== undefined) vars['location']      = input.location || null
		if (input.birthDate    !== undefined) vars['birth_date']    = this.normalizeBirthDate(input.birthDate)
		if (input.businessName !== undefined) vars['business_name'] = input.businessName || null
		if (input.specialty    !== undefined) vars['specialty']     = input.specialty || null
		if (input.phone        !== undefined) vars['phone']         = input.phone || null
		if (input.website      !== undefined) vars['website']       = input.website || null

		return vars
	}

	private normalizeBirthDate(value: string | Date | undefined): string | null {
		if (!value) return null
		if (value instanceof Date) return value.toISOString().slice(0, 10)
		return value
	}
}
