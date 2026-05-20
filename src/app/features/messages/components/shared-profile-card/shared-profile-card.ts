import { Component, computed, inject, input, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PublicUser, UserService } from '@core/services/user.service'
import { User } from '@core/models/user/User'
import { Avatar } from '@shared/components/avatar/avatar'

@Component({
	selector: 'app-shared-profile-card',
	imports: [Avatar, RouterLink],
	templateUrl: './shared-profile-card.html',
})
export class SharedProfileCard implements OnInit {
	private readonly users = inject(UserService)

	userId = input<string | null>(null)
	username = input<string | null>(null)

	readonly user = signal<(User & Partial<PublicUser>) | null>(null)
	readonly loading = signal(true)
	readonly failed = signal(false)

	readonly displayName = computed(() => this.user()?.fullName || this.user()?.username || this.username() || 'Perfil')
	readonly handle = computed(() => this.user()?.username || this.username() || '')
	readonly profileLink = computed(() => this.handle() ? ['/profile', this.handle()] : ['/profile'])
	readonly isLocked = computed(() => !!this.user()?.isPrivate && this.user()?.isViewable === false)

	ngOnInit(): void {
		const username = this.username()
		const userId = this.userId()

		if (username) {
			this.users.getUserByUsername(username).subscribe({
				next: user => {
					this.user.set(user)
					this.loading.set(false)
					this.failed.set(!user)
				},
				error: () => this.markFailed(),
			})
			return
		}

		if (userId) {
			this.users.getUserById(userId).subscribe({
				next: result => {
					this.user.set(result.data)
					this.loading.set(false)
				},
				error: () => this.markFailed(),
			})
			return
		}

		this.markFailed()
	}

	private markFailed(): void {
		this.loading.set(false)
		this.failed.set(true)
	}
}
