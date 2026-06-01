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

/**
 * Componente principal para la vista o página de postdetail.
 */
@Component({
	selector: 'app-post-detail-page',
	imports: [AppShell, Avatar, NgOptimizedImage, RouterLink, TimeAgoPipe, FormsModule, SavoLoader],
	host: { ngSkipHydration: 'true' },
	templateUrl: './post-detail-page.html',
})
/**
 * Componente que representa la página de detalles completos de una publicación o receta.
 * Ofrece visualizaciones multimedia interactivas, ingredientes de receta con adición a la lista de compras,
 * cajón de comentarios integrados en tiempo real y opciones de suscripción/seguimiento de chefs.
 */
export class PostDetailPage {
	/**
	 * Servicio para la extracción de parámetros de la ruta activa.
	 */
	private readonly route       = inject(ActivatedRoute)

	/**
	 * Servicio de enrutador inyectado para la navegación interna.
	 */
	readonly router              = inject(Router)

	/**
	 * Servicio de localización del historial del navegador inyectado para volver atrás.
	 */
	private readonly location    = inject(Location)

	/**
	 * Servicio para interactuar con las publicaciones.
	 */
	private readonly feedService = inject(FeedService)

	/**
	 * Servicio de chefs/usuarios inyectado.
	 */
	private readonly userService = inject(UserService)

	/**
	 * Almacén de estado de autenticación inyectado.
	 */
	private readonly authStore   = inject(AuthStore)

	/**
	 * Servicio de notificaciones toast.
	 */
	private readonly toast       = inject(ToastService)

	/**
	 * Servicio global de interacciones y eventos de publicaciones (likes, guardados).
	 */
	readonly postActions         = inject(PostActionsService)

	/**
	 * Servicio inyectado de control sobre la lista de la compra.
	 */
	readonly shoppingList        = inject(ShoppingListService)

	/**
	 * Almacén de estado de comentarios.
	 */
	readonly comments            = inject(CommentStore)

	/**
	 * Referencia de ciclo de vida para desvincular observables.
	 */
	private readonly destroyRef  = inject(DestroyRef)

	/**
	 * Señal reactiva que contiene los datos de la publicación cargada actualmente.
	 */
	readonly post = signal<Post | null>(null)

	/**
	 * Señal reactiva que indica si la publicación se está cargando de la API.
	 */
	readonly loading = signal(true)

	/**
	 * Señal reactiva con información del error de carga si ocurriera alguno.
	 */
	readonly error = signal<string | null>(null)

	/**
	 * Señal reactiva que determina si la sección/cajón de comentarios está desplegada.
	 */
	readonly commentsVisible  = signal(false)

	/**
	 * Borrador o entrada de texto en búfer para redactar un nuevo comentario.
	 */
	readonly commentDraft     = signal('')

	/**
	 * Señal calculada que indica si se puede enviar el borrador de comentario actual.
	 */
	readonly canSubmitComment = computed(() => this.commentDraft().trim().length > 0 && !this.comments.submitting())

	/**
	 * Índice que apunta a la foto o video actualmente visualizado en el visor multimedia.
	 */
	readonly activeMediaIdx = signal(0)

	/**
	 * Estado de seguimiento del autor del post respecto al usuario activo.
	 */
	readonly followStatus = signal<'none' | 'following' | 'requested'>('none')

	/**
	 * Indica si se está ejecutando la acción de seguir/dejar de seguir al autor.
	 */
	readonly followLoading = signal(false)

	/**
	 * Señal calculada que determina si la publicación pertenece al usuario autenticado.
	 */
	readonly isOwnPost = computed(() => {
		const currentUserId = this.authStore.currentUserId()
		const authorId = this.post()?.author.id
		return !!currentUserId && !!authorId && currentUserId === authorId
	})

	/**
	 * Señal calculada que determina si al usuario le gusta la publicación.
	 */
	readonly liked = computed(() => {
		const p = this.post()
		return p ? this.postActions.isLiked(p.id, p.liked) : false
	})

	/**
	 * Señal calculada con el número consolidado de 'Me gusta'.
	 */
	readonly likesCount = computed(() => {
		const p = this.post()
		return p ? this.postActions.likesCount(p.id, p.likesCount) : 0
	})

	/**
	 * Señal calculada que determina si el post se encuentra guardado en biblioteca.
	 */
	readonly saved = computed(() => {
		const p = this.post()
		return p ? this.postActions.isSaved(p.id, p.saved) : false
	})

	/**
	 * Señal calculada con el número consolidado de veces guardado.
	 */
	readonly savesCount = computed(() => {
		const p = this.post()
		return p ? this.postActions.savesCount(p.id, p.savesCount) : 0
	})

	/**
	 * Señal calculada que devuelve el objeto multimedia principal del post según el índice activo.
	 */
	readonly primaryMedia = computed(() => {
		const post = this.post()
		if (!post) return null
		return post.media[this.activeMediaIdx()] ?? post.media[0] ?? null
	})

	/**
	 * Señal calculada con el nombre del autor.
	 */
	readonly authorName = computed(() => {
		const p = this.post()
		if (!p) return ''
		return p.author.name || p.author.username || 'Chef anónimo'
	})

	/**
	 * Señal calculada con el handle del autor.
	 */
	readonly authorHandle = computed(() => {
		const username = this.post()?.author.username
		return username ? `@${username}` : ''
	})

	/**
	 * Señal calculada con los parámetros de ruta al perfil del autor.
	 */
	readonly profileLink = computed(() => {
		const username = this.post()?.author.username
		return username ? ['/profile', username] : ['/profile']
	})

	/**
	 * Traduce de forma estática la dificultad de la receta (EASY, MEDIUM, HARD) a español.
	 */
	readonly difficultyLabel = computed(() => {
		const map: Record<string, string> = { EASY: 'Fácil', MEDIUM: 'Media', HARD: 'Difícil' }
		return this.post()?.recipe?.difficulty ? map[this.post()!.recipe!.difficulty!] : null
	})

	/**
	 * Inicializa el componente.
	 * Dispara la consulta al servidor para obtener la publicación identificada por ID en la ruta de navegación,
	 * y vincula escuchas para cambios reactivos de me gusta/guardado.
	 */
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

	/**
	 * Carga el estado de seguimiento (following, requested o none) del usuario hacia el creador de la publicación.
	 */
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

	/**
	 * Vuelve atrás utilizando la ubicación del historial de navegación.
	 */
	goBack(): void {
		this.location.back()
	}

	/**
	 * Alterna el estado de seguimiento del autor de la receta de forma reactiva y optimista.
	 */
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

	/**
	 * Modifica y comunica el estado del "me gusta" del post.
	 */
	toggleLike(): void {
		const p = this.post()
		if (!p) return
		this.postActions.toggleLike(p.id, this.liked(), this.likesCount())
	}

	/**
	 * Modifica y comunica el estado de guardado en la biblioteca del post.
	 */
	toggleSave(): void {
		const p = this.post()
		if (!p) return
		this.postActions.toggleSave(p.id, this.saved(), this.savesCount())
	}

	/**
	 * Abre la sección y carga los comentarios de la publicación actual.
	 */
	openComments(): void {
		const post = this.post()
		if (post) this.comments.open(post.id)
		this.commentsVisible.set(true)
	}

	/**
	 * Oculta el cajón de comentarios.
	 */
	closeComments(): void {
		this.commentsVisible.set(false)
	}

	/**
	 * Envía el comentario redactado y limpia el campo borrador.
	 */
	submitComment(): void {
		const text = this.commentDraft().trim()
		if (!text) return
		this.commentDraft.set('')
		this.comments.addComment(text)
	}

	/**
	 * Maneja la paginación reactiva de comentarios al hacer scroll sobre el listado de comentarios.
	 * @param event Evento de desplazamiento.
	 */
	onCommentScroll(event: Event): void {
		const el = event.target as HTMLElement
		if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
			this.comments.loadMore()
		}
	}

	/**
	 * Devuelve el nombre del autor del comentario.
	 * @param comment Objeto comentario.
	 */
	commentAuthorName(comment: Comment): string {
		return comment.author.name || comment.author.username || 'Chef'
	}

	/**
	 * Determina si el comentario pertenece al usuario activo.
	 * @param comment Objeto comentario.
	 */
	isOwnComment(comment: Comment): boolean {
		return !!this.authStore.currentUserId() && comment.authorId === this.authStore.currentUserId()
	}

	/**
	 * Añade todos los ingredientes descritos en la receta directamente a la lista de compras del usuario.
	 */
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
