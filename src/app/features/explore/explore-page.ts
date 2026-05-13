import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgOptimizedImage } from '@angular/common'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { ExploreStore } from '@core/store/explore.store'
import { FeedStore } from '@core/store/feed.store'
import { SearchService, SearchPost, SearchUser } from '@core/services/search.service'
import { ExploreCategoryTabs } from './components/explore-category-tabs/explore-category-tabs'
import { ExploreHero } from './components/explore-hero/explore-hero'
import { ExploreRightRail } from './components/explore-right-rail/explore-right-rail'
import { ExploreToolbar } from './components/explore-toolbar/explore-toolbar'
import { ExploreTopbar } from './components/explore-topbar/explore-topbar'
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
		ExploreTopbar,
		RecipeDiscoveryGrid,
	],
	templateUrl: './explore-page.html',
})
export class ExplorePage implements OnInit {
	readonly explore = inject(ExploreStore)
	private readonly feed = inject(FeedStore)
	private readonly searchService = inject(SearchService)

	readonly searchQuery = signal('')
	readonly searchPosts = signal<SearchPost[]>([])
	readonly searchUsers = signal<SearchUser[]>([])
	readonly searchLoading = signal(false)
	readonly activeTab = signal<'posts' | 'users'>('posts')

	readonly isSearching = computed(() => this.searchQuery().trim().length >= 2)

	ngOnInit(): void {
		if (this.explore.posts().length === 0) {
			this.explore.loadExplore()
		}
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

	toggleSave(post: Parameters<FeedStore['toggleSave']>[0]): void {
		this.feed.toggleSave(post)
	}
}
