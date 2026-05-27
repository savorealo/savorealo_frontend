import { Component, inject, OnInit, signal } from '@angular/core'
import { Apollo } from 'apollo-angular'
import { RouterLink } from '@angular/router'
import { map } from 'rxjs'
import { SUGGESTED_USERS_QUERY, TOGGLE_FOLLOW_MUTATION } from '@graphql/feed.mutations'
import { AuthStore } from '@core/store/auth.store'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Interfaz que define la estructura o contrato de datos para suggesteduser.
 */
interface SuggestedUser {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string | null
	/**
	 * Propiedad para gestionar display nombre.
	 */
	display_name: string | null
	/**
	 * Propiedad para gestionar avatar enlace.
	 */
	avatar_url: string | null
	/**
	 * Indicador booleano para es o está following.
	 */
	isFollowing: boolean
	/**
	 * Propiedad para gestionar follow cargando.
	 */
	followLoading: boolean
}

/**
 * Clase de utilidad para suggestionspanel.
 */
@Component({
	selector: 'app-suggestions-panel',
	imports: [RouterLink, TranslatePipe],
	templateUrl: './suggestions-panel.html',
})
export class SuggestionsPanel implements OnInit {
	/**
	 * Propiedad para gestionar apollo.
	 */
	private readonly apollo    = inject(Apollo)
	/**
	 * Propiedad para gestionar auth store.
	 */
	private readonly authStore = inject(AuthStore)

	/**
	 * Propiedad para gestionar suggestions.
	 */
	readonly suggestions = signal<SuggestedUser[]>([])
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading     = signal(true)

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al inicializar el componente.
	 */
	ngOnInit(): void {
		this.apollo.query<{ suggestedUsers: SuggestedUser[] }>({
			query: SUGGESTED_USERS_QUERY,
			variables: { preferenceIds: [], limit: 5 },
			fetchPolicy: 'network-only',
		}).pipe(
			map(res => (res.data?.suggestedUsers ?? [])
				.filter(u => u.id !== this.authStore.currentUserId())
				.slice(0, 5)
				.map(u => ({ ...u, followLoading: false })),
			),
		).subscribe({
			next: users => { this.suggestions.set(users); this.loading.set(false) },
			error: ()  => { this.loading.set(false) },
		})
	}

	/**
	 * Método para alternar follow.
	 */
	toggleFollow(user: SuggestedUser): void {
		if (user.followLoading) return
		this.suggestions.update(list =>
			list.map(u => u.id === user.id ? { ...u, followLoading: true } : u),
		)
		this.apollo.mutate<{ toggleFollow: { following: boolean } }>({
			mutation: TOGGLE_FOLLOW_MUTATION,
			variables: { userId: user.id },
		}).subscribe({
			next: res => {
				const following = res.data?.toggleFollow?.following ?? !user.isFollowing
				this.suggestions.update(list =>
					list.map(u => u.id === user.id ? { ...u, isFollowing: following, followLoading: false } : u),
				)
			},
			error: () => {
				this.suggestions.update(list =>
					list.map(u => u.id === user.id ? { ...u, followLoading: false } : u),
				)
			},
		})
	}

	/**
	 * Método para display nombre.
	 */
	displayName(u: SuggestedUser): string {
		return u.display_name || u.username || 'Chef'
	}
}
