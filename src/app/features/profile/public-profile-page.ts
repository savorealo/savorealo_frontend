import { afterNextRender, Component, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { finalize } from 'rxjs'
import { UserService, PublicUser, FollowListUser } from '@core/services/user.service'
import { AuthStore } from '@core/store/auth.store'
import { ToastService } from '@core/services/toast.service'
import { Post } from '@core/models/post/post.model'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive'
import { TabsModule } from 'primeng/tabs'
import { DialogModule } from 'primeng/dialog'

@Component({
	selector: 'app-public-profile-page',
	imports: [AppShell, Avatar, RouterLink, TabsModule, DialogModule, ImgFallbackDirective],
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

	readonly showFollowList = signal(false)
	readonly followListTitle = signal('')
	readonly followListUsers = signal<FollowListUser[]>([])
	readonly followListLoading = signal(false)

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

	openFollowList(type: 'followers' | 'following'): void {
		const user = this.user()
		if (!user || !this.isViewable()) return

		this.followListTitle.set(type === 'followers' ? 'Seguidores' : 'Siguiendo')
		this.followListUsers.set([])
		this.followListLoading.set(true)
		this.showFollowList.set(true)

		const obs = type === 'followers'
			? this.userService.getFollowers(user.id)
			: this.userService.getFollowing(user.id)

		obs.subscribe({
			next: users => {
				this.followListUsers.set(users)
				this.followListLoading.set(false)
			},
			error: () => this.followListLoading.set(false),
		})
	}

	toggleFollow(): void {
		const user = this.user()
		if (!user || this.followLoading()) return

		const wasStatus = user.followStatus
		const wasFollowers = user.followersCount ?? 0
		this.followLoading.set(true)

		// Optimistic update based on current state
		let optimisticStatus: 'none' | 'following' | 'requested'
		let optimisticFollowers = wasFollowers
		if (wasStatus === 'following') {
			optimisticStatus = 'none'
			optimisticFollowers = wasFollowers - 1
		} else if (wasStatus === 'requested') {
			optimisticStatus = 'none'
		} else {
			optimisticStatus = user.isPrivate ? 'requested' : 'following'
			if (!user.isPrivate) optimisticFollowers = wasFollowers + 1
		}
		this.user.update(u => u ? {
			...u,
			isFollowedByCurrentUser: optimisticStatus === 'following',
			followStatus: optimisticStatus,
			followersCount: optimisticFollowers,
		} : u)

		this.userService.toggleFollow(user.id, wasStatus === 'following').pipe(
			finalize(() => this.followLoading.set(false)),
		).subscribe({
			next: result => {
				const newStatus: 'none' | 'following' | 'requested' =
					result.following ? 'following' : result.requested ? 'requested' : 'none'
				// Reconcile with server response
				let newFollowers = wasFollowers
				if (result.following && wasStatus !== 'following') newFollowers = wasFollowers + 1
				else if (!result.following && wasStatus === 'following') newFollowers = wasFollowers - 1
				this.user.update(u => u ? {
					...u,
					isFollowedByCurrentUser: result.following,
					followStatus: newStatus,
					followersCount: newFollowers,
				} : u)
				const name = this.user()?.fullName || this.user()?.username || 'este usuario'
				if (result.following) {
					this.toast.success(`Ahora sigues a ${name}`, '')
				} else if (result.requested) {
					this.toast.success(`Solicitud enviada a ${name}`, '')
				} else if (wasStatus === 'requested') {
					this.toast.success(`Solicitud cancelada`, '')
				} else {
					this.toast.success(`Dejaste de seguir a ${name}`, '')
				}
			},
			error: () => {
				this.user.update(u => u ? {
					...u,
					isFollowedByCurrentUser: wasStatus === 'following',
					followStatus: wasStatus,
					followersCount: wasFollowers,
				} : u)
				this.toast.error('No se pudo actualizar el seguimiento')
			},
		})
	}
}
