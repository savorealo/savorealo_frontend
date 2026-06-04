import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core'
import { Observable, tap, throwError } from 'rxjs'
import { finalize } from 'rxjs/operators'
import { StoriesService } from '@core/services/stories.service'
import { AuthStore } from '@core/store/auth.store'
import { StoryGroup } from '@core/models/story/story.model'

/**
 * Almacén de estado reactivo para gestionar la lógica de las historias (stories).
 */
@Injectable({ providedIn: 'root' })
export class StoriesStore {
	/**
	 * Propiedad para gestionar stories service.
	 */
	private readonly storiesService = inject(StoriesService)
	/**
	 * Propiedad para gestionar auth store.
	 */
	private readonly authStore = inject(AuthStore)
	/**
	 * Propiedad para gestionar initialized.
	 */
	private readonly _initialized = signal(false)

	/**
	 * Propiedad para gestionar groups.
	 */
	readonly groups = signal<StoryGroup[]>([])
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading = signal(false)
	/**
	 * Propiedad para gestionar viewer abrir.
	 */
	readonly viewerOpen = signal(false)
	/**
	 * Propiedad para gestionar active group idx.
	 */
	readonly activeGroupIdx = signal(0)  // índice relativo a viewerGroups, no a groups
	/**
	 * Propiedad para gestionar active story idx.
	 */
	readonly activeStoryIdx = signal(0)

	/** Tu propio grupo de historias (va en el botón "Tu historia", no en la fila). */
	readonly myGroup = computed(() => {
		const id = this.authStore.currentUserId()
		return id ? this.groups().find(g => g.userId === id) ?? null : null
	})

	/** Historias del resto — lo que se muestra en la tira horizontal. */
	readonly otherGroups = computed(() => {
		const id = this.authStore.currentUserId()
		return this.groups().filter(g => g.userId !== id)
	})

	// 'others' = navegar dentro de otherGroups; 'mine' = solo mi propio grupo
	/**
	 * Propiedad para gestionar viewer scope.
	 */
	private readonly viewerScope = signal<'others' | 'mine'>('others')

	/** Lista sobre la que navega el visor (depende del scope). */
	private readonly viewerGroups = computed(() =>
		this.viewerScope() === 'mine'
			? (this.myGroup() ? [this.myGroup()!] : [])
			: this.otherGroups()
	)

	/**
	 * Propiedad para gestionar active group.
	 */
	readonly activeGroup = computed(() => this.viewerGroups()[this.activeGroupIdx()] ?? null)
	/**
	 * Propiedad para gestionar active story.
	 */
	readonly activeStory = computed(() => this.activeGroup()?.stories[this.activeStoryIdx()] ?? null)

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
	constructor() {
		// La sesión Supabase se restaura de forma asíncrona: `currentUserId()`
		// arranca null y se rellena después. Reaccionamos a ese cambio para
		// disparar la carga en cuanto haya usuario (en vez de un único intento
		// en ngOnInit que puede llegar demasiado pronto y no reintentarse).
		effect(() => {
			const userId = this.authStore.currentUserId()
			if (userId) untracked(() => this.load())
		})
	}

	/**
	 * Método para cargar.
	 */
	load(): void {
		const userId = this.authStore.currentUserId()
		if (!userId || this._initialized()) return
		this._initialized.set(true)
		this.loading.set(true)
		this.storiesService.getStories(userId).pipe(
			finalize(() => this.loading.set(false)),
		).subscribe({
			next: groups => this.groups.set(groups),
			error: () => {
				this._initialized.set(false)
			},
		})
	}

	/** Abre el visor en un grupo — scope determinado automáticamente. */
	openGroup(group: StoryGroup): void {
		const isMine = group.userId === this.authStore.currentUserId()
		this.viewerScope.set(isMine ? 'mine' : 'others')
		const list = isMine
			? (this.myGroup() ? [this.myGroup()!] : [])
			: this.otherGroups()
		const idx = list.findIndex(g => g.userId === group.userId)
		if (idx >= 0) this.openViewer(idx)
	}

	/**
	 * Método para abrir viewer.
	 */
	openViewer(groupIdx: number): void {
		this.activeGroupIdx.set(groupIdx)
		this.activeStoryIdx.set(0)
		this.viewerOpen.set(true)
		this._markCurrentViewed()
	}

	/**
	 * Método para cerrar viewer.
	 */
	closeViewer(): void {
		this.viewerOpen.set(false)
	}

	/**
	 * Método para next story.
	 */
	nextStory(): void {
		const group = this.activeGroup()
		if (!group) return
		const groups = this.viewerGroups()
		if (this.activeStoryIdx() < group.stories.length - 1) {
			this.activeStoryIdx.update(i => i + 1)
			this._markCurrentViewed()
		} else if (this.activeGroupIdx() < groups.length - 1) {
			this.activeGroupIdx.update(i => i + 1)
			this.activeStoryIdx.set(0)
			this._markCurrentViewed()
		} else {
			this.closeViewer() // no saltar entre scopes
		}
	}

	/**
	 * Método para prev story.
	 */
	prevStory(): void {
		if (this.activeStoryIdx() > 0) {
			this.activeStoryIdx.update(i => i - 1)
			this._markCurrentViewed()
		} else if (this.activeGroupIdx() > 0) {
			this.activeGroupIdx.update(i => i - 1)
			const prevGroup = this.activeGroup()
			this.activeStoryIdx.set(prevGroup ? prevGroup.stories.length - 1 : 0)
			this._markCurrentViewed()
		}
	}

	/**
	 * Método para añadir story.
	 */
	addStory(file: File): Observable<void> {
		const userId = this.authStore.currentUserId()
		if (!userId) return throwError(() => new Error('No hay sesión'))
		return this.storiesService.createStory(userId, file).pipe(
			tap(() => {
				this._initialized.set(false)
				this.load()
			}),
		)
	}

	/**
	 * Método para mark current viewed.
	 */
	private _markCurrentViewed(): void {
		const story = this.activeStory()
		const userId = this.authStore.currentUserId()
		if (!story || !userId || story.viewed) return

		this.groups.update(groups => groups.map(g => ({
			...g,
			stories: g.stories.map(s => s.id === story.id ? { ...s, viewed: true } : s),
			hasUnviewed: g.stories.some(s => s.id !== story.id && !s.viewed),
		})))

		this.storiesService.markViewed(story.id, userId).subscribe()
	}
}
