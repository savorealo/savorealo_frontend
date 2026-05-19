import { afterNextRender, Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgOptimizedImage } from '@angular/common'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { ExploreStore } from '@core/store/explore.store'
import { Post } from '@core/models/post/post.model'
import { SearchService, SearchPost, SearchUser } from '@core/services/search.service'
import { ExploreCategoryTabs } from './components/explore-category-tabs/explore-category-tabs'
import { ExploreHero } from './components/explore-hero/explore-hero'
import { ExploreRightRail } from './components/explore-right-rail/explore-right-rail'
import { ExploreToolbar } from './components/explore-toolbar/explore-toolbar'
import { RecipeDiscoveryGrid } from './components/recipe-discovery-grid/recipe-discovery-grid'

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
	],
	templateUrl: './explore-page.html',
})
export class ExplorePage implements OnInit, OnDestroy {
	private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('exploreScroll')

	readonly explore = inject(ExploreStore)
	private readonly searchService = inject(SearchService)

	readonly searchQuery = signal('')
	readonly searchPosts = signal<SearchPost[]>([])
	readonly searchUsers = signal<SearchUser[]>([])
	readonly searchLoading = signal(false)
	readonly activeTab = signal<'posts' | 'users'>('posts')

	readonly isSearching = computed(() => this.searchQuery().trim().length >= 2)

	readonly pullProgress = signal(0)
	readonly pullTriggered = signal(false)
	private pullStartY = 0
	private pulling = false

	constructor() {
		afterNextRender(() => {
			const saved = this.explore.scrollTop
			if (saved > 0) {
				this.scrollContainer()?.nativeElement.scrollTo({ top: saved })
			}
			this.setupPullToRefresh()
		})
	}

	ngOnInit(): void {
		if (this.explore.isStale()) {
			this.explore.loadExplore()
		}
	}

	ngOnDestroy(): void {
		const el = this.scrollContainer()?.nativeElement
		this.explore.saveScroll(el?.scrollTop ?? 0)
	}

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

	onInputSearch(event: Event): void {
		this.onQueryChange((event.target as HTMLInputElement).value)
	}

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

	toggleSave(post: Post): void {
		this.explore.toggleSave(post)
	}
}
