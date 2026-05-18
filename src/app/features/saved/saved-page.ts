import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { NgClass } from '@angular/common'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { SavedRecipeCard } from './components/saved-recipe-card/saved-recipe-card'
import { SavedFilter } from './models/saved.models'
import { FeedService } from '@core/services/feed.service'
import { Post } from '@core/models/post/post.model'

@Component({
	selector: 'app-saved-page',
	imports: [NgClass, AppShell, SavedRecipeCard],
	templateUrl: './saved-page.html',
})
export class SavedPage implements OnInit {
	private readonly feedService = inject(FeedService)

	readonly filter = signal<SavedFilter>('all')
	readonly query = signal('')
	readonly posts = signal<Post[]>([])
	readonly loading = signal(true)
	readonly totalCount = signal(0)

	readonly filterOptions: { value: SavedFilter; label: string; icon: string }[] = [
		{ value: 'all', label: 'Todo', icon: 'pi pi-th-large' },
		{ value: 'recipes', label: 'Recetas', icon: 'pi pi-book' },
		{ value: 'posts', label: 'Posts', icon: 'pi pi-images' },
	]

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

	ngOnInit(): void {
		this.feedService.getSavedPosts(24).subscribe({
			next: ({ posts, totalCount }) => {
				this.posts.set(posts)
				this.totalCount.set(totalCount)
				this.loading.set(false)
			},
			error: () => this.loading.set(false),
		})
	}

	setFilter(filter: SavedFilter): void {
		this.filter.set(filter)
	}

	setQuery(event: Event): void {
		this.query.set((event.target as HTMLInputElement).value)
	}

	removeSaved(postId: string): void {
		this.feedService.toggleSave(postId).subscribe()
		this.posts.update(items => items.filter(p => p.id !== postId))
	}
}
