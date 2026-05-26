import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { finalize } from 'rxjs'
import { UserService, PublicUser, FollowListUser } from '@core/services/user.service'
import { AuthStore } from '@core/store/auth.store'
import { ToastService } from '@core/services/toast.service'
import { PostActionsService } from '@core/services/post-actions.service'
import { Post } from '@core/models/post/post.model'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive'
import { TabsModule } from 'primeng/tabs'
import { DialogModule } from 'primeng/dialog'
import { ShareProfileModal, ShareableProfile } from '@features/messages/components/share-profile-modal/share-profile-modal'
import { TranslationService } from '@core/services/translation.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
	selector: 'app-public-profile-page',
	imports: [AppShell, Avatar, RouterLink, TabsModule, DialogModule, ImgFallbackDirective, ShareProfileModal, TranslatePipe],
	templateUrl: './public-profile-page.html',
})
export class PublicProfilePage {
	private readonly route = inject(ActivatedRoute)
	readonly router = inject(Router)
	private readonly t = inject(TranslationService)
	private readonly userService = inject(UserService)
	private readonly authStore   = inject(AuthStore)
	private readonly toast       = inject(ToastService)
	private readonly postActions = inject(PostActionsService)
	private readonly destroyRef  = inject(DestroyRef)

	readonly user          = signal<PublicUser | null>(null)
	readonly posts         = signal<Post[]>([])
	readonly loading       = signal(true)
	readonly loadingPosts  = signal(false)
	readonly error         = signal<string | null>(null)
	readonly followLoading = signal(false)
	readonly sharingProfile = signal<ShareableProfile | null>(null)

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
	readonly followsYou = computed(() => !!this.user()?.followsYou)

	constructor() {
		this.postActions.likeChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(e =>
			this.posts.update(ps => ps.map(p =>
				p.id === e.postId ? { ...p, liked: e.liked, likesCount: e.likesCount } : p,
			)),
		)
		this.postActions.saveChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(e =>
			this.posts.update(ps => ps.map(p =>
				p.id === e.postId ? { ...p, saved: e.saved, savesCount: e.savesCount } : p,
			)),
		)
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

		this.followListTitle.set(type === 'followers' ? this.t.translate('profile.followers') : this.t.translate('profile.following'))
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

	messageUser(): void {
		const user = this.user()
		if (!user) return
		this.router.navigate(['/chat'], { queryParams: { with: user.id } })
	}

	openShareProfile(): void {
		const user = this.user()
		if (!user) return
		this.sharingProfile.set({
			id: user.id,
			username: user.username,
			displayName: user.fullName,
			photoUrl: user.photo_url,
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
				let newFollowers = wasFollowers
				if (result.following && wasStatus !== 'following') newFollowers = wasFollowers + 1
				else if (!result.following && wasStatus === 'following') newFollowers = wasFollowers - 1
				this.user.update(u => u ? {
					...u,
					isFollowedByCurrentUser: result.following,
					followStatus: newStatus,
					followersCount: newFollowers,
				} : u)
				this.postActions.followChanged$.next({
					userId: user.id,
					following: result.following,
					requested: result.requested,
				})
				const name = this.user()?.fullName || this.user()?.username || 'este usuario'
				if (result.following) {
					this.toast.success(`${this.t.translate('public.now_following')} ${name}`, '')
				} else if (result.requested) {
					this.toast.success(`${this.t.translate('public.request_sent')} ${name}`, '')
				} else if (wasStatus === 'requested') {
					this.toast.success(this.t.translate('public.request_cancelled'), '')
				} else {
					this.toast.success(`${this.t.translate('public.unfollowed')} ${name}`, '')
				}
			},
			error: () => {
				this.user.update(u => u ? {
					...u,
					isFollowedByCurrentUser: wasStatus === 'following',
					followStatus: wasStatus,
					followersCount: wasFollowers,
				} : u)
				this.toast.error(this.t.translate('public.follow_error'))
			},
		})
	}
}
