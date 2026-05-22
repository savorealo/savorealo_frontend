import { afterNextRender, Component, ElementRef, input, OnDestroy, output, signal, viewChild } from '@angular/core'
import { Post }        from '@core/models/post/post.model'
import { Emptystate }  from '@shared/components/emptystate/emptystate'
import { PostCard }    from '@shared/components/post-card/post-card'
import { SkeletonCard } from '@shared/components/skeleton-card/skeleton-card'
import { Spinner }     from '@shared/components/spinner/spinner'

@Component({
	selector: 'app-feed-post-list',
	imports: [Emptystate, PostCard, SkeletonCard, Spinner],
	templateUrl: './feed-post-list.html',
})
export class FeedPostList implements OnDestroy {
	private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer')
	private readonly sentinel        = viewChild<ElementRef<HTMLElement>>('sentinel')
	private observer?: IntersectionObserver

	private pullStartY = 0
	private pulling = false
	readonly pullProgress = signal(0)
	readonly pullTriggered = signal(false)

	posts       = input<Post[]>([])
	loading     = input(false)
	loadingMore = input(false)
	refreshing  = input(false)
	isEmpty     = input(false)
	error       = input<string | null>(null)
	hasNextPage = input(true)

	comment = output<Post>()
	report  = output<Post>()
	share   = output<Post>()
	retry   = output<void>()
	nearEnd = output<void>()
	explore = output<void>()
	refresh = output<void>()

	readonly emitExplore = () => this.explore.emit()

	constructor() {
		afterNextRender(() => {
			this.setupObserver()
			this.setupPullToRefresh()
		})
	}

	private setupObserver(): void {
		const sentinel = this.sentinel()?.nativeElement
		const root     = this.scrollContainer()?.nativeElement
		if (!sentinel || !root) return

		this.observer = new IntersectionObserver(
			entries => { if (entries[0].isIntersecting) this.nearEnd.emit() },
			{ root, rootMargin: '600px' },
		)
		this.observer.observe(sentinel)
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
				this.refresh.emit()
			}
			this.pulling = false
			this.pullProgress.set(0)
			this.pullTriggered.set(false)
		}, { passive: true })
	}

	scrollToTop(): void {
		this.scrollContainer()?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' })
	}

	currentScroll(): number {
		return this.scrollContainer()?.nativeElement.scrollTop ?? 0
	}

	restoreScroll(top: number): void {
		this.scrollContainer()?.nativeElement.scrollTo({ top })
	}

	ngOnDestroy(): void {
		this.observer?.disconnect()
	}
}
