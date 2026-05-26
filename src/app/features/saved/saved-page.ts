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

const PAGE_SIZE = 18

@Component({
	selector: 'app-saved-page',
	imports: [NgClass, AppShell, SavedRecipeCard, Spinner, TranslatePipe],
	templateUrl: './saved-page.html',
})
export class SavedPage {
	private readonly feedService = inject(FeedService)
	private readonly postActions = inject(PostActionsService)
	private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel')
	private observer?: IntersectionObserver

	readonly filter = signal<SavedFilter>('all')
	readonly query = signal('')
	readonly posts = signal<Post[]>([])
	readonly loading = signal(true)
	readonly loadingMore = signal(false)
	readonly hasNextPage = signal(false)
	private nextCursor: string | null = null

	readonly filterOptions: { value: SavedFilter; labelKey: string; icon: string }[] = [
		{ value: 'all', labelKey: 'saved.filter.all', icon: 'pi pi-th-large' },
		{ value: 'recipes', labelKey: 'saved.filter.recipes', icon: 'pi pi-book' },
		{ value: 'posts', labelKey: 'saved.filter.posts', icon: 'pi pi-images' },
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

	private setupIntersectionObserver(): void {
		this.observer = new IntersectionObserver(
			entries => { if (entries[0]?.isIntersecting) this.loadMore() },
			{ rootMargin: '200px' },
		)
		const el = this.sentinel()?.nativeElement
		if (el) this.observer.observe(el)
	}

	setFilter(filter: SavedFilter): void {
		this.filter.set(filter)
	}

	setQuery(event: Event): void {
		this.query.set((event.target as HTMLInputElement).value)
	}

	removeSaved(postId: string): void {
		const post = this.posts().find(p => p.id === postId)
		this.posts.update(items => items.filter(p => p.id !== postId))
		if (post) {
			this.postActions.toggleSave(postId, true, post.savesCount)
		}
	}
}
