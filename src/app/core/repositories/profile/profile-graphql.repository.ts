import { inject, Injectable } from '@angular/core'
import { Apollo } from 'apollo-angular'
import { from, map, Observable } from 'rxjs'
import { UPDATE_PROFILE_MUTATION } from '@graphql/feed.mutations'
import type { GqlUpdateProfileResult, IProfileRepository } from './profile-repository'

/**
 * Repositorio de datos para profilegraphql.
 */
@Injectable({ providedIn: 'root' })
export class ProfileGraphqlRepository implements IProfileRepository {
	/**
	 * Propiedad para gestionar apollo.
	 */
	private readonly apollo = inject(Apollo)

	/**
	 * Método para actualizar profile.
	 */
	updateProfile(variables: Record<string, unknown>): Observable<GqlUpdateProfileResult> {
		return from(
			this.apollo.mutate<{ updateProfile: GqlUpdateProfileResult }>({
				mutation: UPDATE_PROFILE_MUTATION,
				variables,
			}).toPromise(),
		).pipe(
			map(res => {
				const updated = res?.data?.updateProfile
				if (!updated) throw new Error('No se pudo actualizar el perfil')
				return updated
			}),
		)
	}

	/**
	 * Método para evict user from cache.
	 */
	evictUserFromCache(userId: string): void {
		try {
			const cache = this.apollo.client.cache
			cache.evict({ id: cache.identify({ __typename: 'users', id: userId }) })
			cache.evict({ id: 'ROOT_QUERY', fieldName: 'user' })
			cache.gc()
		} catch { /* cache best-effort */ }
	}
}
