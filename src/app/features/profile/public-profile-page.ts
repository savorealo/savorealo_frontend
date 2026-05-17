import { afterNextRender, Component, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { finalize } from 'rxjs'
import { UserService, PublicUser } from '@core/services/user.service'
import { AuthStore } from '@core/store/auth.store'
import { ToastService } from '@core/services/toast.service'
import { Post } from '@core/models/post/post.model'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { TabsModule } from 'primeng/tabs'

@Component({
	selector: 'app-public-profile-page',
	imports: [AppShell, Avatar, RouterLink, TabsModule],
	templateUrl: './public-profile-page.html',
})
export class PublicProfilePage {
	private readonly route = inject(ActivatedRoute)
	readonly router = inject(Router)
	private readonly userService = inject(UserService)
	private readonly authStore   = inject(AuthStore)
	private readonly toast       = inject(ToastService)

	readonly user          = signal<PublicUser | null>(null)
	readonly posts         = signal<Post[]>([])
	readonly loading       = signal(true)
	readonly loadingPosts  = signal(false)
	readonly error         = signal<string | null>(null)
	readonly followLoading = signal(false)

	readonly isOwnProfile = computed(() => {
		const currentUsername = this.authStore.profile()?.username
		const pageUsername = this.route.snapshot.paramMap.get('username')
		return currentUsername === pageUsername
	})

	readonly displayName = computed(() =>
		this.user()?.fullName || this.user()?.username || 'Chef Savorealo',
	)
	readonly location = computed(() => this.user()?.location || null)
	readonly isPrivate = computed(() => !!this.user()?.isPrivate)
	readonly isViewable = computed(() => this.user()?.isViewable !== false)

	constructor() {
		// El estado de seguimiento (`isFollowing`) depende de la sesión Supabase,
		// que no existe en SSR. Si cargáramos en el servidor, el backend
		// resolvería `isFollowing=false` y la hidratación dejaría ese valor
		// obsoleto. Por eso cargamos solo en el navegador, ya autenticados.
		afterNextRender(() => this.load())
	}

	private load(): void {
		const username = this.route.snapshot.paramMap.get('username')
		if (!username) { this.router.navigate(['/']); return }

		if (this.isOwnProfile()) { this.router.navigate(['/profile']); return }

		this.userService.getUserByUsername(username).pipe(
			finalize(() => this.loading.set(false)),
		).subscribe({
			next: user => {
				if (!user) { this.error.set('Usuario no encontrado'); return }
				this.user.set(user)
				if (user.isViewable) this.loadUserPosts(user.id)
			},
			error: err => this.error.set(err.message ?? 'No se pudo cargar el perfil'),
		})
	}

	private loadUserPosts(userId: string): void {
		this.loadingPosts.set(true)
		this.userService.getUserPosts(userId).pipe(
			finalize(() => this.loadingPosts.set(false)),
		).subscribe({
			next: page => this.posts.set(page.posts),
			error: () => {},
		})
	}

	toggleFollow(): void {
		const user = this.user()
		if (!user || this.followLoading()) return

		const wasFollowing = user.isFollowedByCurrentUser
		this.followLoading.set(true)
		// Optimistic update
		this.user.update(u => u ? { ...u, isFollowedByCurrentUser: !wasFollowing, followersCount: (u.followersCount ?? 0) + (wasFollowing ? -1 : 1) } : u)

		this.userService.toggleFollow(user.id, wasFollowing).pipe(
			finalize(() => this.followLoading.set(false)),
		).subscribe({
			next: nowFollowing => {
				this.user.update(u => u ? { ...u, isFollowedByCurrentUser: nowFollowing } : u)
				const name = this.user()?.fullName || this.user()?.username || 'este usuario'
				this.toast.success(nowFollowing ? `Ahora sigues a ${name}` : `Dejaste de seguir a ${name}`, '')
			},
			error: () => {
				this.user.update(u => u ? { ...u, isFollowedByCurrentUser: wasFollowing, followersCount: (u.followersCount ?? 0) + (wasFollowing ? 1 : -1) } : u)
				this.toast.error('No se pudo actualizar el seguimiento')
			},
		})
	}
}
