import { afterNextRender, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core'
import { NgClass } from '@angular/common'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Spinner } from '@shared/components/spinner/spinner'
import { SavedRecipeCard } from './components/saved-recipe-card/saved-recipe-card'
import { SavedFilter } from './models/saved.models'
import { FeedService } from '@core/services/feed.service'
import { PostActionsService } from '@core/services/post-actions.service'
import { Post } from '@core/models/post/post.model'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Tamaño de la página por defecto para la carga paginada de publicaciones guardadas.
 */
const PAGE_SIZE = 18

/**
 * Componente que representa la biblioteca o página de publicaciones guardadas por el usuario.
 * Proporciona filtrado interactivo por tipo (todo, recetas, posts), buscador interno y scroll infinito de carga diferida.
 */
@Component({
	selector: 'app-saved-page',
	imports: [NgClass, AppShell, SavedRecipeCard, Spinner, TranslatePipe],
	templateUrl: './saved-page.html',
})
export class SavedPage {
	/**
	 * Servicio para la obtención de flujos de publicaciones.
	 */
	private readonly feedService = inject(FeedService)

	/**
	 * Servicio inyectado para gestionar acciones y suscripciones reactivas sobre posts.
	 */
	private readonly postActions = inject(PostActionsService)

	/**
	 * Referencia de vista al elemento marcador (sentinel) para activar el scroll infinito.
	 */
	private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel')

	/**
	 * Observador de intersección nativo para detectar la visibilidad del sentinel y cargar más datos.
	 */
	private observer?: IntersectionObserver

	/**
	 * Señal reactiva que gestiona el filtro de visualización activo.
	 */
	readonly filter = signal<SavedFilter>('all')

	/**
	 * Señal reactiva con el término de búsqueda para el filtrado en cliente.
	 */
	readonly query = signal('')

	/**
	 * Señal reactiva con la colección completa de publicaciones guardadas obtenidas del servidor.
	 */
	readonly posts = signal<Post[]>([])

	/**
	 * Señal que indica si se está cargando la primera página de resultados.
	 */
	readonly loading = signal(true)

	/**
	 * Señal que indica si se está realizando una carga adicional de publicaciones (paginación).
	 */
	readonly loadingMore = signal(false)

	/**
	 * Señal que indica si existen más páginas disponibles para paginar en el servidor.
	 */
	readonly hasNextPage = signal(false)

	/**
	 * Cursor alfanumérico que apunta a la siguiente página de elementos en el backend.
	 */
	private nextCursor: string | null = null

	/**
	 * Opciones de filtrado del menú superior con sus etiquetas e iconos.
	 */
	readonly filterOptions: { value: SavedFilter; labelKey: string; icon: string }[] = [
		{ value: 'all', labelKey: 'saved.filter.all', icon: 'pi pi-th-large' },
		{ value: 'recipes', labelKey: 'saved.filter.recipes', icon: 'pi pi-book' },
		{ value: 'posts', labelKey: 'saved.filter.posts', icon: 'pi pi-images' },
	]

	/**
	 * Señal calculada que devuelve las publicaciones aplicando el filtro de tipo y la consulta de búsqueda de texto.
	 */
	readonly filteredItems = computed(() => {
		const filter = this.filter()
		const query = this.query().trim().toLowerCase()

		return this.posts().filter(post => {
			const matchesFilter =
				filter === 'all' ||
				(filter === 'recipes' && post.recipe !== null) ||
				(filter === 'posts' && post.recipe === null)

			const searchable = [
				post.title,
				post.description,
				post.recipe?.name,
				post.author.name,
				post.author.username,
				...post.categories,
			].filter(Boolean).join(' ').toLowerCase()

			return matchesFilter && (!query || searchable.includes(query))
		})
	})

	/**
	 * Inicializa el componente.
	 * Configura la carga inicial en el cliente tras el renderizado e implementa la suscripción reactiva ante des-guardados.
	 */
	constructor() {
		afterNextRender(() => {
			this.loadPage()
			this.setupIntersectionObserver()
		})
		this.postActions.saveChanged$.subscribe(e => {
			if (!e.saved) {
				this.posts.update(items => items.filter(p => p.id !== e.postId))
			}
		})
	}

	/**
	 * Carga la primera página de publicaciones guardadas e inicializa el cursor.
	 */
	private loadPage(): void {
		this.loading.set(true)
		this.posts.set([])
		this.nextCursor = null

		this.feedService.getSavedPosts(PAGE_SIZE).subscribe({
			next: ({ posts, endCursor, hasNextPage }) => {
				this.posts.set(posts)
				this.nextCursor = endCursor
				this.hasNextPage.set(hasNextPage)
				this.loading.set(false)
			},
			error: () => this.loading.set(false),
		})
	}

	/**
	 * Pide y carga la siguiente página de publicaciones del servidor empleando el cursor al hacer scroll.
	 */
	loadMore(): void {
		if (this.loadingMore() || !this.hasNextPage() || !this.nextCursor) return

		this.loadingMore.set(true)
		this.feedService.getSavedPosts(PAGE_SIZE, this.nextCursor).subscribe({
			next: ({ posts, endCursor, hasNextPage }) => {
				this.posts.update(current => [...current, ...posts])
				this.nextCursor = endCursor
				this.hasNextPage.set(hasNextPage)
				this.loadingMore.set(false)
			},
			error: () => this.loadingMore.set(false),
		})
	}

	/**
	 * Configura el observador de intersección (IntersectionObserver) para el sensor inferior.
	 */
	private setupIntersectionObserver(): void {
		this.observer = new IntersectionObserver(
			entries => { if (entries[0]?.isIntersecting) this.loadMore() },
			{ rootMargin: '200px' },
		)
		const el = this.sentinel()?.nativeElement
		if (el) this.observer.observe(el)
	}

	/**
	 * Modifica el filtro de tipo de guardado activo.
	 * @param filter El tipo de filtro seleccionado.
	 */
	setFilter(filter: SavedFilter): void {
		this.filter.set(filter)
	}

	/**
	 * Actualiza el término de búsqueda de texto del buscador en base al evento del input.
	 * @param event Evento de teclado/input.
	 */
	setQuery(event: Event): void {
		this.query.set((event.target as HTMLInputElement).value)
	}

	/**
	 * Elimina una publicación de la lista de guardados local y comunica la acción al servidor.
	 * @param postId Identificador único de la publicación a quitar.
	 */
	removeSaved(postId: string): void {
		const post = this.posts().find(p => p.id === postId)
		this.posts.update(items => items.filter(p => p.id !== postId))
		if (post) {
			this.postActions.toggleSave(postId, true, post.savesCount)
		}
	}
}
