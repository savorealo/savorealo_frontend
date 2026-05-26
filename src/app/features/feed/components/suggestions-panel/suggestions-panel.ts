import { Component, inject, OnInit, signal } from '@angular/core'
import { Apollo } from 'apollo-angular'
import { RouterLink } from '@angular/router'
import { map } from 'rxjs'
import { SUGGESTED_USERS_QUERY, TOGGLE_FOLLOW_MUTATION } from '@graphql/feed.mutations'
import { AuthStore } from '@core/store/auth.store'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

interface SuggestedUser {
	id: string
	username: string | null
	display_name: string | null
	avatar_url: string | null
	isFollowing: boolean
	followLoading: boolean
}

@Component({
	selector: 'app-suggestions-panel',
	imports: [RouterLink, TranslatePipe],
	templateUrl: './suggestions-panel.html',
})
export class SuggestionsPanel implements OnInit {
	private readonly apollo    = inject(Apollo)
	private readonly authStore = inject(AuthStore)

	readonly suggestions = signal<SuggestedUser[]>([])
	readonly loading     = signal(true)

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

	displayName(u: SuggestedUser): string {
		return u.display_name || u.username || 'Chef'
	}
}
