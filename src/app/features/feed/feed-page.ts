import { afterNextRender, Component, inject, OnDestroy, signal, ViewChild } from '@angular/core'
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
import { SharePostModal } from '@features/messages/components/share-post-modal/share-post-modal'

/**
 * Componente principal para la vista o página de el feed de publicaciones.
 */
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
		SharePostModal,
	],
	templateUrl: './feed-page.html',
})
export class FeedPage implements OnDestroy {
	/**
	 * Propiedad para gestionar post lista.
	 */
	@ViewChild(FeedPostList) private postList?: FeedPostList

	/**
	 * Propiedad para gestionar feed.
	 */
	readonly feed = inject(FeedStore)
	/**
	 * Propiedad para gestionar router.
	 */
	private readonly router = inject(Router)
	/**
	 * Propiedad para gestionar selected post.
	 */
	readonly selectedPost = signal<Post | null>(null)
	/**
	 * Propiedad para gestionar comments abrir.
	 */
	readonly commentsOpen = signal(false)
	/**
	 * Propiedad para gestionar composer abrir.
	 */
	readonly composerOpen = signal(false)
	/**
	 * Propiedad para gestionar reporting post.
	 */
	readonly reportingPost = signal<Post | null>(null)
	/**
	 * Propiedad para gestionar sharing post.
	 */
	readonly sharingPost = signal<Post | null>(null)

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
	constructor() {
		afterNextRender(() => {
			const saved = this.feed.scrollTop
			if (saved > 0) {
				this.postList?.restoreScroll(saved)
			}
			if (this.feed.isStale()) {
				this.feed.loadHomeFeed()
			}
		})
	}

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al destruir el componente para liberar recursos.
	 */
	ngOnDestroy(): void {
		const top = this.postList?.currentScroll() ?? 0
		this.feed.saveScroll(top)
	}

	/**
	 * Método para abrir comments.
	 */
	openComments(post: Post): void {
		this.selectedPost.set(post)
		this.commentsOpen.set(true)
	}

	/**
	 * Método para abrir report.
	 */
	openReport(post: Post): void {
		this.reportingPost.set(post)
	}

	/**
	 * Método para cerrar report.
	 */
	closeReport(): void {
		this.reportingPost.set(null)
	}

	/**
	 * Método para abrir share.
	 */
	openShare(post: Post): void {
		this.sharingPost.set(post)
	}

	/**
	 * Método para cerrar share.
	 */
	closeShare(): void {
		this.sharingPost.set(null)
	}

	/**
	 * Método para añadir created post.
	 */
	addCreatedPost(post: Post): void {
		this.feed.prependPost(post)
		this.composerOpen.set(false)
		this.postList?.scrollToTop()
	}

	/**
	 * Método para navigate to explore.
	 */
	navigateToExplore(): void {
		this.router.navigate(['/explore'])
	}
}
