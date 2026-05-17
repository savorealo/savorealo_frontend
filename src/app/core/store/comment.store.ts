import { computed, inject, Injectable, signal } from '@angular/core'
import { finalize } from 'rxjs'
import { Comment } from '@core/models/post-actions/post-actions.model'
import { CommentService } from '@core/services/comment.service'
import { ToastService } from '@core/services/toast.service'
import { FeedStore } from './feed.store'
import { toUserMessage } from '@core/utils/user-error'

@Injectable({ providedIn: 'root' })
export class CommentStore {
	private readonly commentService = inject(CommentService)
	private readonly feedStore      = inject(FeedStore)
	private readonly toast          = inject(ToastService)

	private readonly _postId = signal<string | null>(null)
	private readonly _comments = signal<Comment[]>([])
	private readonly _loading = signal(false)
	private readonly _loadingMore = signal(false)
	private readonly _submitting = signal(false)
	private readonly _error = signal<string | null>(null)
	private readonly _endCursor = signal<string | null>(null)
	private readonly _hasNextPage = signal(false)

	readonly postId = this._postId.asReadonly()
	readonly comments = this._comments.asReadonly()
	readonly loading = this._loading.asReadonly()
	readonly loadingMore = this._loadingMore.asReadonly()
	readonly submitting = this._submitting.asReadonly()
	readonly error = this._error.asReadonly()
	readonly hasNextPage = this._hasNextPage.asReadonly()
	readonly isEmpty = computed(() => !this._loading() && this._comments().length === 0)

	open(postId: string): void {
		this._postId.set(postId)
		this._comments.set([])
		this._endCursor.set(null)
		this._hasNextPage.set(false)
		this.load(postId)
	}

	loadMore(): void {
		const postId = this._postId()
		if (!postId || !this._hasNextPage() || this._loadingMore()) return

		this._loadingMore.set(true)
		this._error.set(null)

		this.commentService.getPostComments(postId, 20, this._endCursor()).pipe(
			finalize(() => this._loadingMore.set(false)),
		).subscribe({
			next: page => {
				this._comments.update(comments => [...comments, ...page.comments])
				this._endCursor.set(page.endCursor)
				this._hasNextPage.set(page.hasNextPage)
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudieron cargar más comentarios')),
		})
	}

	addComment(text: string): void {
		const postId = this._postId()
		const cleanText = text.trim()
		if (!postId || !cleanText || this._submitting()) return

		const optimistic: Comment = {
			id: `optimistic-${Date.now()}`,
			postId,
			authorId: 'current-user',
			author: { username: 'tu', name: 'Tu comentario', photoUrl: null },
			text: cleanText,
			createdAt: new Date(),
		}

		this._comments.update(comments => [optimistic, ...comments])
		this.feedStore.incrementComments(postId)
		this._submitting.set(true)
		this._error.set(null)

		this.commentService.addComment(postId, cleanText).pipe(
			finalize(() => this._submitting.set(false)),
		).subscribe({
			next: comment => {
				this._comments.update(comments =>
					comments.map(item => item.id === optimistic.id ? comment : item),
				)
				this.toast.success('Comentario publicado', '')
			},
			error: err => {
				this._comments.update(comments => comments.filter(item => item.id !== optimistic.id))
				this.feedStore.decrementComments(postId)
				this._error.set(toUserMessage(err, 'No se pudo comentar'))
				this.toast.error('No se pudo publicar el comentario')
			},
		})
	}

	deleteComment(comment: Comment): void {
		this._comments.update(comments => comments.filter(item => item.id !== comment.id))
		this.feedStore.decrementComments(comment.postId)

		this.commentService.deleteComment(comment.id).subscribe({
			error: err => {
				this._comments.update(comments => [comment, ...comments])
				this.feedStore.incrementComments(comment.postId)
				this._error.set(toUserMessage(err, 'No se pudo eliminar el comentario'))
			},
		})
	}

	private load(postId: string): void {
		this._loading.set(true)
		this._error.set(null)

		this.commentService.getPostComments(postId).pipe(
			finalize(() => this._loading.set(false)),
		).subscribe({
			next: page => {
				this._comments.set(page.comments)
				this._endCursor.set(page.endCursor)
				this._hasNextPage.set(page.hasNextPage)
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudieron cargar los comentarios')),
		})
	}
}
