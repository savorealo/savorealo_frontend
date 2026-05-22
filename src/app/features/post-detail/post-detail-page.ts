import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Location } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { NgOptimizedImage } from '@angular/common'
import { finalize } from 'rxjs'
import { FeedService } from '@core/services/feed.service'
import { UserService } from '@core/services/user.service'
import { AuthStore } from '@core/store/auth.store'
import { ToastService } from '@core/services/toast.service'
import { PostActionsService } from '@core/services/post-actions.service'
import { CommentStore } from '@core/store/comment.store'
import { Post } from '@core/models/post/post.model'
import { Comment } from '@core/models/post-actions/post-actions.model'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'
import { SavoLoader } from '@shared/components/savo-loader/savo-loader'
import { ShoppingListService } from '@features/shopping-list/shopping-list.service'

@Component({
	selector: 'app-post-detail-page',
	imports: [AppShell, Avatar, NgOptimizedImage, RouterLink, TimeAgoPipe, FormsModule, SavoLoader],
	host: { ngSkipHydration: 'true' },
	templateUrl: './post-detail-page.html',
})
export class PostDetailPage {
	private readonly route       = inject(ActivatedRoute)
	readonly router              = inject(Router)
	private readonly location    = inject(Location)
	private readonly feedService = inject(FeedService)
	private readonly userService = inject(UserService)
	private readonly authStore   = inject(AuthStore)
	private readonly toast       = inject(ToastService)
	readonly postActions         = inject(PostActionsService)
	readonly shoppingList        = inject(ShoppingListService)
	readonly comments            = inject(CommentStore)
	private readonly destroyRef  = inject(DestroyRef)

	readonly post = signal<Post | null>(null)
	readonly loading = signal(true)
	readonly error = signal<string | null>(null)
	readonly commentsVisible  = signal(false)
	readonly commentDraft     = signal('')
	readonly canSubmitComment = computed(() => this.commentDraft().trim().length > 0 && !this.comments.submitting())
	readonly activeMediaIdx = signal(0)
	readonly followStatus = signal<'none' | 'following' | 'requested'>('none')
	readonly followLoading = signal(false)

	readonly isOwnPost = computed(() => {
		const currentUserId = this.authStore.currentUserId()
		const authorId = this.post()?.author.id
		return !!currentUserId && !!authorId && currentUserId === authorId
	})

	readonly liked = computed(() => {
		const p = this.post()
		return p ? this.postActions.isLiked(p.id, p.liked) : false
	})
	readonly likesCount = computed(() => {
		const p = this.post()
		return p ? this.postActions.likesCount(p.id, p.likesCount) : 0
	})
	readonly saved = computed(() => {
		const p = this.post()
		return p ? this.postActions.isSaved(p.id, p.saved) : false
	})
	readonly savesCount = computed(() => {
		const p = this.post()
		return p ? this.postActions.savesCount(p.id, p.savesCount) : 0
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

	constructor() {
		afterNextRender(() => {
			const id = this.route.snapshot.paramMap.get('id')
			if (!id) {
				this.router.navigate(['/'])
				return
			}
			this.feedService.getPostById(id).subscribe({
				next: post => {
					this.post.set(post)
					this.loading.set(false)
					this.loadFollowStatus()
				},
				error: err => {
					this.error.set(err.message ?? 'No se pudo cargar el post')
					this.loading.set(false)
				},
			})
		})

		this.postActions.likeChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(e => {
			this.post.update(p => p?.id === e.postId ? ({ ...p, liked: e.liked, likesCount: e.likesCount }) as Post : p)
		})
		this.postActions.saveChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(e => {
			this.post.update(p => p?.id === e.postId ? ({ ...p, saved: e.saved, savesCount: e.savesCount }) as Post : p)
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
			error: () => {throw new Error('No se pudo cargar el estado de seguimiento')},
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
				this.postActions.followChanged$.next({
					userId: authorId,
					following: result.following,
					requested: result.requested,
				})
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
		const p = this.post()
		if (!p) return
		this.postActions.toggleLike(p.id, this.liked(), this.likesCount())
	}

	toggleSave(): void {
		const p = this.post()
		if (!p) return
		this.postActions.toggleSave(p.id, this.saved(), this.savesCount())
	}

	openComments(): void {
		const post = this.post()
		if (post) this.comments.open(post.id)
		this.commentsVisible.set(true)
	}

	closeComments(): void {
		this.commentsVisible.set(false)
	}

	submitComment(): void {
		const text = this.commentDraft().trim()
		if (!text) return
		this.commentDraft.set('')
		this.comments.addComment(text)
	}

	onCommentScroll(event: Event): void {
		const el = event.target as HTMLElement
		if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
			this.comments.loadMore()
		}
	}

	commentAuthorName(comment: Comment): string {
		return comment.author.name || comment.author.username || 'Chef'
	}

	isOwnComment(comment: Comment): boolean {
		return !!this.authStore.currentUserId() && comment.authorId === this.authStore.currentUserId()
	}

	addToShoppingList(): void {
		const post = this.post()
		if (!post?.recipe) return
		const added = this.shoppingList.addFromRecipe(post.recipe, post.title ?? '')
		if (added > 0) {
			this.toast.success(`${added} ingrediente${added !== 1 ? 's' : ''} añadido${added !== 1 ? 's' : ''} a la lista`)
		} else {
			this.toast.info('Todos los ingredientes ya están en tu lista')
		}
	}
}
