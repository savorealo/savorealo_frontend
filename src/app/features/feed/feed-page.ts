import { afterNextRender, Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core'
import { Router } from '@angular/router'
import { Post } from '@core/models/post/post.model'
import { FeedStore } from '@core/store/feed.store'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { CommentsSheetComponent } from './comments-sheet.component'
import { CreatePostComponent } from './create-post.component'
import { FeedPostList } from './components/feed-post-list/feed-post-list'
import { FeedRightRail } from './components/feed-right-rail/feed-right-rail'
import { StoriesStrip } from './components/stories-strip/stories-strip'
import { StoryViewer } from './components/story-viewer/story-viewer'
import { ReportSheet } from './components/report-sheet/report-sheet'

@Component({
	selector: 'app-feed-page',
	imports: [
		AppShell,
		CommentsSheetComponent,
		CreatePostComponent,
		FeedPostList,
		FeedRightRail,
		StoriesStrip,
		StoryViewer,
		ReportSheet,
	],
	templateUrl: './feed-page.html',
})
export class FeedPage implements OnInit, OnDestroy {
	@ViewChild(FeedPostList) private postList?: FeedPostList

	readonly feed = inject(FeedStore)
	private readonly router = inject(Router)
	readonly selectedPost = signal<Post | null>(null)
	readonly commentsOpen = signal(false)
	readonly composerOpen = signal(false)
	readonly reportingPost = signal<Post | null>(null)

	constructor() {
		afterNextRender(() => {
			const saved = this.feed.scrollTop
			if (saved > 0) {
				this.postList?.restoreScroll(saved)
			}
		})
	}

	ngOnInit(): void {
		if (this.feed.isStale()) {
			this.feed.loadHomeFeed()
		}
	}

	ngOnDestroy(): void {
		const top = this.postList?.currentScroll() ?? 0
		this.feed.saveScroll(top)
	}

	openComments(post: Post): void {
		this.selectedPost.set(post)
		this.commentsOpen.set(true)
	}

	openReport(post: Post): void {
		this.reportingPost.set(post)
	}

	closeReport(): void {
		this.reportingPost.set(null)
	}

	addCreatedPost(post: Post): void {
		this.feed.prependPost(post)
		this.composerOpen.set(false)
		this.postList?.scrollToTop()
	}

	navigateToExplore(): void {
		this.router.navigate(['/explore'])
	}
}
