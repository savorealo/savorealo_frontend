import { afterNextRender, Component, computed, inject, OnInit, signal } from '@angular/core'
import { Location } from '@angular/common'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { NgOptimizedImage } from '@angular/common'
import { finalize } from 'rxjs'
import { FeedService } from '@core/services/feed.service'
import { FeedStore } from '@core/store/feed.store'
import { UserService } from '@core/services/user.service'
import { AuthStore } from '@core/store/auth.store'
import { ToastService } from '@core/services/toast.service'
import { Post } from '@core/models/post/post.model'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'
import { CommentsSheetComponent } from '@features/feed/comments-sheet.component'

@Component({
	selector: 'app-post-detail-page',
	imports: [AppShell, Avatar, NgOptimizedImage, RouterLink, TimeAgoPipe, CommentsSheetComponent],
	host: { ngSkipHydration: 'true' },
	templateUrl: './post-detail-page.html',
})
export class PostDetailPage implements OnInit {
	private readonly route = inject(ActivatedRoute)
	readonly router = inject(Router)
	private readonly location = inject(Location)
	private readonly feedService = inject(FeedService)
	private readonly feedStore = inject(FeedStore)
	private readonly userService = inject(UserService)
	private readonly authStore = inject(AuthStore)
	private readonly toast = inject(ToastService)

	readonly post = signal<Post | null>(null)
	readonly loading = signal(true)
	readonly error = signal<string | null>(null)
	readonly commentsVisible = signal(false)
	readonly activeMediaIdx = signal(0)
	readonly followStatus = signal<'none' | 'following' | 'requested'>('none')
	readonly followLoading = signal(false)

	readonly isOwnPost = computed(() => {
		const currentUserId = this.authStore.currentUserId()
		const authorId = this.post()?.author.id
		return !!currentUserId && !!authorId && currentUserId === authorId
	})

	readonly primaryMedia = computed(() => {
		const post = this.post()
		if (!post) return null
		return post.media[this.activeMediaIdx()] ?? post.media[0] ?? null
	})

	readonly authorName = computed(() => {
		const p = this.post()
		if (!p) return ''
		return p.author.name || p.author.username || 'Chef anónimo'
	})
	readonly authorHandle = computed(() => {
		const username = this.post()?.author.username
		return username ? `@${username}` : ''
	})
	readonly profileLink = computed(() => {
		const username = this.post()?.author.username
		return username ? ['/profile', username] : ['/profile']
	})
	readonly difficultyLabel = computed(() => {
		const map: Record<string, string> = { EASY: 'Fácil', MEDIUM: 'Media', HARD: 'Difícil' }
		return this.post()?.recipe?.difficulty ? map[this.post()!.recipe!.difficulty!] : null
	})

	private _browserReady = false

	constructor() {
		afterNextRender(() => { this._browserReady = true; this.loadFollowStatus() })
	}

	ngOnInit(): void {
		const id = this.route.snapshot.paramMap.get('id')
		if (!id) {
			this.router.navigate(['/'])
			return
		}
		this.feedService.getPostById(id).subscribe({
			next: post => {
				this.post.set(post)
				this.loading.set(false)
				if (this._browserReady) this.loadFollowStatus()
			},
			error: err => {
				this.error.set(err.message ?? 'No se pudo cargar el post')
				this.loading.set(false)
			},
		})
	}

	private loadFollowStatus(): void {
		const authorId = this.post()?.author.id
		if (!authorId || this.isOwnPost()) return

		this.userService.getUserById(authorId).subscribe({
			next: ({ data }) => {
				const user = data as unknown as { followStatus?: string }
				const raw = user?.followStatus ?? 'none'
				this.followStatus.set(
					raw === 'following' || raw === 'requested' ? raw as 'following' | 'requested' : 'none',
				)
			},
			error: () => {},
		})
	}

	goBack(): void {
		this.location.back()
	}

	toggleFollow(): void {
		const authorId = this.post()?.author.id
		if (!authorId || this.followLoading()) return

		const wasStatus = this.followStatus()
		this.followLoading.set(true)

		let optimisticStatus: 'none' | 'following' | 'requested'
		if (wasStatus === 'following' || wasStatus === 'requested') {
			optimisticStatus = 'none'
		} else {
			optimisticStatus = 'following'
		}
		this.followStatus.set(optimisticStatus)

		this.userService.toggleFollow(authorId, wasStatus === 'following').pipe(
			finalize(() => this.followLoading.set(false)),
		).subscribe({
			next: result => {
				const newStatus: 'none' | 'following' | 'requested' =
					result.following ? 'following' : result.requested ? 'requested' : 'none'
				this.followStatus.set(newStatus)
				const name = this.authorName()
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
				this.followStatus.set(wasStatus)
				this.toast.error('No se pudo actualizar el seguimiento')
			},
		})
	}

	toggleLike(): void {
		const post = this.post()
		if (!post) return
		this.feedStore.toggleLike(post)
		this.post.update(p => p ? {
			...p,
			liked: !p.liked,
			likesCount: p.liked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
		} : p)
	}

	toggleSave(): void {
		const post = this.post()
		if (!post) return
		this.feedStore.toggleSave(post)
		this.post.update(p => p ? {
			...p,
			saved: !p.saved,
			savesCount: p.saved ? Math.max(0, p.savesCount - 1) : p.savesCount + 1,
		} : p)
	}
}
