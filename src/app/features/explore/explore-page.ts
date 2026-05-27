import { afterNextRender, Component, computed, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgOptimizedImage } from '@angular/common'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { ExploreStore } from '@core/store/explore.store'
import { SearchService, SearchPost, SearchUser } from '@core/services/search.service'
import { ExploreCategoryTabs } from './components/explore-category-tabs/explore-category-tabs'
import { ExploreHero } from './components/explore-hero/explore-hero'
import { ExploreRightRail } from './components/explore-right-rail/explore-right-rail'
import { ExploreToolbar } from './components/explore-toolbar/explore-toolbar'
import { RecipeDiscoveryGrid } from './components/recipe-discovery-grid/recipe-discovery-grid'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Componente principal para la vista o página de explore.
 */
@Component({
	selector: 'app-explore-page',
	imports: [
		AppShell,
		Avatar,
		NgOptimizedImage,
		RouterLink,
		ExploreCategoryTabs,
		ExploreHero,
		ExploreRightRail,
		ExploreToolbar,
		RecipeDiscoveryGrid,
		TranslatePipe,
	],
	templateUrl: './explore-page.html',
})
export class ExplorePage implements OnDestroy {
	/**
	 * Propiedad para gestionar scroll container.
	 */
	private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('exploreScroll')

	/**
	 * Propiedad para gestionar explore.
	 */
	readonly explore = inject(ExploreStore)
	/**
	 * Propiedad para gestionar buscar service.
	 */
	private readonly searchService = inject(SearchService)

	/**
	 * Propiedad para gestionar buscar query.
	 */
	readonly searchQuery = signal('')
	/**
	 * Propiedad para gestionar buscar posts.
	 */
	readonly searchPosts = signal<SearchPost[]>([])
	/**
	 * Propiedad para gestionar buscar users.
	 */
	readonly searchUsers = signal<SearchUser[]>([])
	/**
	 * Propiedad para gestionar buscar cargando.
	 */
	readonly searchLoading = signal(false)
	/**
	 * Propiedad para gestionar active tab.
	 */
	readonly activeTab = signal<'posts' | 'users'>('posts')

	/**
	 * Indicador booleano para es o está searching.
	 */
	readonly isSearching = computed(() => this.searchQuery().trim().length >= 2)

	/**
	 * Propiedad para gestionar pull progress.
	 */
	readonly pullProgress = signal(0)
	/**
	 * Propiedad para gestionar pull triggered.
	 */
	readonly pullTriggered = signal(false)
	/**
	 * Propiedad para gestionar pull start y.
	 */
	private pullStartY = 0
	/**
	 * Propiedad para gestionar pulling.
	 */
	private pulling = false

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
	constructor() {
		afterNextRender(() => {
			const saved = this.explore.scrollTop
			if (saved > 0) {
				this.scrollContainer()?.nativeElement.scrollTo({ top: saved })
			}
			this.setupPullToRefresh()
			if (this.explore.isStale()) {
				this.explore.loadExplore()
			}
		})
	}

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al destruir el componente para liberar recursos.
	 */
	ngOnDestroy(): void {
		const el = this.scrollContainer()?.nativeElement
		this.explore.saveScroll(el?.scrollTop ?? 0)
	}

	/**
	 * Método para setup pull to refrescar.
	 */
	private setupPullToRefresh(): void {
		const el = this.scrollContainer()?.nativeElement
		if (!el) return

		el.addEventListener('touchstart', (e: TouchEvent) => {
			if (el.scrollTop <= 0) {
				this.pullStartY = e.touches[0].clientY
				this.pulling = true
			}
		}, { passive: true })

		el.addEventListener('touchmove', (e: TouchEvent) => {
			if (!this.pulling || el.scrollTop > 0) {
				this.pulling = false
				this.pullProgress.set(0)
				return
			}
			const dy = e.touches[0].clientY - this.pullStartY
			if (dy > 0) {
				this.pullProgress.set(Math.min(dy / 100, 1))
				this.pullTriggered.set(dy >= 100)
			}
		}, { passive: true })

		el.addEventListener('touchend', () => {
			if (this.pullTriggered()) {
				this.explore.refresh()
			}
			this.pulling = false
			this.pullProgress.set(0)
			this.pullTriggered.set(false)
		}, { passive: true })
	}

	/**
	 * Método para evento de input buscar.
	 */
	onInputSearch(event: Event): void {
		this.onQueryChange((event.target as HTMLInputElement).value)
	}

	/**
	 * Método para evento de query cambiar.
	 */
	onQueryChange(q: string): void {
		this.searchQuery.set(q)
		if (q.trim().length < 2) {
			this.searchPosts.set([])
			this.searchUsers.set([])
			return
		}
		this.searchLoading.set(true)
		let done = 0
		this.searchService.searchPosts(q).subscribe({
			next: posts => { this.searchPosts.set(posts); if (++done === 2) this.searchLoading.set(false) },
			error: () => { if (++done === 2) this.searchLoading.set(false) },
		})
		this.searchService.searchUsers(q).subscribe({
			next: users => { this.searchUsers.set(users); if (++done === 2) this.searchLoading.set(false) },
			error: () => { if (++done === 2) this.searchLoading.set(false) },
		})
	}

}
