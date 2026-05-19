import { afterNextRender, Component, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { UserService, SuggestedUser } from '@core/services/user.service'

@Component({
	selector: 'app-suggestions-panel',
	templateUrl: './suggestions-panel.html',
	imports: [RouterLink],
})
export class SuggestionsPanel {
	private readonly userService = inject(UserService)

	readonly suggestions = signal<SuggestedUser[]>([])
	readonly loading = signal(true)
	readonly followingInProgress = signal<Set<string>>(new Set())

	constructor() {
		afterNextRender(() => {
			this.userService.getSuggestedUsers([], 5).subscribe({
				next: users => {
					this.suggestions.set(users)
					this.loading.set(false)
				},
				error: () => this.loading.set(false),
			})
		})
	}

	follow(user: SuggestedUser): void {
		if (this.followingInProgress().has(user.id)) return
		this.followingInProgress.update(s => new Set(s).add(user.id))

		this.userService.toggleFollow(user.id, user.isFollowing).subscribe({
			next: ({ following }) => {
				this.suggestions.update(list =>
					list.map(u => u.id === user.id ? { ...u, isFollowing: following } : u),
				)
			},
			complete: () => {
				this.followingInProgress.update(s => {
					const next = new Set(s)
					next.delete(user.id)
					return next
				})
			},
		})
	}
}
