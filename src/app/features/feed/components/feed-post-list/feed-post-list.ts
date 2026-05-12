import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling'
import { Component, input, output, ViewChild } from '@angular/core'
import { Post } from '@core/models/post/post.model'
import { Emptystate } from '@shared/components/emptystate/emptystate'
import { PostCard } from '@shared/components/post-card/post-card'
import { SkeletonCard } from '@shared/components/skeleton-card/skeleton-card'

@Component({
	selector: 'app-feed-post-list',
	imports: [Emptystate, PostCard, ScrollingModule, SkeletonCard],
	templateUrl: './feed-post-list.html',
})
export class FeedPostList {
	@ViewChild(CdkVirtualScrollViewport) private viewport?: CdkVirtualScrollViewport

	posts = input<Post[]>([])
	loading = input(false)
	loadingMore = input(false)
	isEmpty = input(false)
	error = input<string | null>(null)

	like = output<Post>()
	save = output<Post>()
	comment = output<Post>()
	retry = output<void>()
	nearEnd = output<void>()

	trackById(_index: number, post: Post): string {
		return post.id
	}

	onScrolledIndexChange(): void {
		const viewport = this.viewport
		if (!viewport) return

		const rendered = viewport.getRenderedRange()
		const total = viewport.getDataLength()
		if (rendered.end >= total - 3) this.nearEnd.emit()
	}

	scrollToTop(): void {
		this.viewport?.scrollToIndex(0, 'smooth')
	}
}
