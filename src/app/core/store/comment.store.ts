import { computed, inject, Injectable, signal } from '@angular/core'
import { finalize } from 'rxjs'
import { Comment } from '@core/models/post-actions/post-actions.model'
import { CommentService } from '@core/services/comment.service'
import { ToastService } from '@core/services/toast.service'
import { PostActionsService } from '@core/services/post-actions.service'
import { toUserMessage } from '@core/utils/user-error'

/**
 * Almacén de estado reactivo para gestionar la lógica de un comentario.
 */
@Injectable({ providedIn: 'root' })
export class CommentStore {
	/**
	 * Propiedad para gestionar comment service.
	 */
	private readonly commentService = inject(CommentService)
	/**
	 * Propiedad para gestionar post actions.
	 */
	private readonly postActions    = inject(PostActionsService)
	/**
	 * Propiedad para gestionar toast.
	 */
	private readonly toast          = inject(ToastService)

	/**
	 * Propiedad para gestionar post identificador.
	 */
	private readonly _postId = signal<string | null>(null)
	/**
	 * Propiedad para gestionar comments.
	 */
	private readonly _comments = signal<Comment[]>([])
	/**
	 * Propiedad para gestionar cargando.
	 */
	private readonly _loading = signal(false)
	/**
	 * Propiedad para gestionar cargando more.
	 */
	private readonly _loadingMore = signal(false)
	/**
	 * Propiedad para gestionar submitting.
	 */
	private readonly _submitting = signal(false)
	/**
	 * Propiedad para gestionar error.
	 */
	private readonly _error = signal<string | null>(null)
	/**
	 * Propiedad para gestionar end cursor.
	 */
	private readonly _endCursor = signal<string | null>(null)
	/**
	 * Propiedad para gestionar tiene next page.
	 */
	private readonly _hasNextPage = signal(false)

	/**
	 * Propiedad para gestionar post identificador.
	 */
	readonly postId = this._postId.asReadonly()
	/**
	 * Propiedad para gestionar comments.
	 */
	readonly comments = this._comments.asReadonly()
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading = this._loading.asReadonly()
	/**
	 * Propiedad para gestionar cargando more.
	 */
	readonly loadingMore = this._loadingMore.asReadonly()
	/**
	 * Propiedad para gestionar submitting.
	 */
	readonly submitting = this._submitting.asReadonly()
	/**
	 * Propiedad para gestionar error.
	 */
	readonly error = this._error.asReadonly()
	/**
	 * Indicador booleano para tiene next page.
	 */
	readonly hasNextPage = this._hasNextPage.asReadonly()
	/**
	 * Indicador booleano para es o está empty.
	 */
	readonly isEmpty = computed(() => !this._loading() && this._comments().length === 0)

	/**
	 * Método para abrir.
	 */
	open(postId: string): void {
		this._postId.set(postId)
		this._comments.set([])
		this._endCursor.set(null)
		this._hasNextPage.set(false)
		this.load(postId)
	}

	/**
	 * Método para cargar more.
	 */
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

	/**
	 * Método para añadir comment.
	 */
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
		this.postActions.commentCountChanged$.next({ postId, delta: 1 })
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
				this.postActions.commentCountChanged$.next({ postId, delta: -1 })
				this._error.set(toUserMessage(err, 'No se pudo comentar'))
				this.toast.error('No se pudo publicar el comentario')
			},
		})
	}

	/**
	 * Método para eliminar comment.
	 */
	deleteComment(comment: Comment): void {
		this._comments.update(comments => comments.filter(item => item.id !== comment.id))
		this.postActions.commentCountChanged$.next({ postId: comment.postId, delta: -1 })

		this.commentService.deleteComment(comment.id).subscribe({
			error: err => {
				this._comments.update(comments => [comment, ...comments])
				this.postActions.commentCountChanged$.next({ postId: comment.postId, delta: 1 })
				this._error.set(toUserMessage(err, 'No se pudo eliminar el comentario'))
			},
		})
	}

	/**
	 * Método para cargar.
	 */
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
