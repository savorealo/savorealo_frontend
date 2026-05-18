import { afterNextRender, Component, ElementRef, input, OnDestroy, output, viewChild } from '@angular/core'
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

	posts       = input<Post[]>([])
	loading     = input(false)
	loadingMore = input(false)
	isEmpty     = input(false)
	error       = input<string | null>(null)
	hasNextPage = input(true)

	like    = output<Post>()
	save    = output<Post>()
	comment = output<Post>()
	report  = output<Post>()
	retry   = output<void>()
	nearEnd = output<void>()
	explore = output<void>()

	readonly emitExplore = () => this.explore.emit()

	constructor() {
		afterNextRender(() => this.setupObserver())
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

	scrollToTop(): void {
		this.scrollContainer()?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' })
	}

	ngOnDestroy(): void {
		this.observer?.disconnect()
	}
}
