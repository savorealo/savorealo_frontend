import { inject, Injectable } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { map, catchError } from 'rxjs/operators'
import { User } from '@core/models/user/User'
import { PROFILE_REPOSITORY } from '@core/repositories/tokens/repository.tokens'

/**
 * Interfaz que define la estructura o contrato de datos para updatepersonprofileinput.
 */
export interface UpdatePersonProfileInput {
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username?: string
	/**
	 * Propiedad para gestionar display nombre.
	 */
	displayName?: string
	/**
	 * Propiedad para gestionar avatar enlace.
	 */
	avatarUrl?: string
	/**
	 * Propiedad para gestionar biografía.
	 */
	bio?: string
	/**
	 * Propiedad para gestionar ubicación.
	 */
	location?: string
	/**
	 * Propiedad para gestionar birth fecha.
	 */
	birthDate?: string | Date
	/**
	 * Propiedad para gestionar business nombre.
	 */
	businessName?: string
	/**
	 * Propiedad para gestionar specialty.
	 */
	specialty?: string
	/**
	 * Propiedad para gestionar phone.
	 */
	phone?: string
	/**
	 * Propiedad para gestionar website.
	 */
	website?: string
	/**
	 * Propiedad deprecada para gestionar display nombre completo heredado.
	 * @deprecated Usar displayName en su lugar.
	 */
	fullName?: string
	/**
	 * Propiedad deprecada para gestionar el enlace de foto heredado.
	 * @deprecated Usar avatarUrl en su lugar.
	 */
	photoUrl?: string
}

/**
 * Servicio que provee la lógica de negocio para el perfil del chef.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
	/**
	 * Propiedad para gestionar repo.
	 */
	private readonly repo = inject(PROFILE_REPOSITORY)

	/**
	 * Método para actualizar profile.
	 */
	updateProfile(input: UpdatePersonProfileInput, _token?: string): Observable<User> {
		const variables = this.buildVariables(input)

		if (Object.keys(variables).length === 0) {
			return throwError(() => new Error('Debes proporcionar al menos un campo a actualizar'))
		}

		return this.repo.updateProfile(variables).pipe(
			map(updated => {
				this.repo.evictUserFromCache(updated.id)

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

	/**
	 * Método para build variables.
	 */
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

	/**
	 * Método para normalize birth fecha.
	 */
	private normalizeBirthDate(value: string | Date | undefined): string | null {
		if (!value) return null
		if (value instanceof Date) return value.toISOString().slice(0, 10)
		return value
	}
}
