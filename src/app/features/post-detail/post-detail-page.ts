import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { Location } from '@angular/common'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { NgOptimizedImage } from '@angular/common'
import { FeedService } from '@core/services/feed.service'
import { FeedStore } from '@core/store/feed.store'
import { Post } from '@core/models/post/post.model'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'
import { CommentsSheetComponent } from '@features/feed/comments-sheet.component'

@Component({
	selector: 'app-post-detail-page',
	imports: [AppShell, Avatar, NgOptimizedImage, RouterLink, TimeAgoPipe, CommentsSheetComponent],
	host: { ngSkipHydration: 'true' },
	templateUrl: './post-detail-page.html',
})
export class PostDetailPage implements OnInit {
	private readonly route = inject(ActivatedRoute)
	readonly router = inject(Router)
	private readonly location = inject(Location)
	private readonly feedService = inject(FeedService)
	private readonly feedStore = inject(FeedStore)

	readonly post = signal<Post | null>(null)
	readonly loading = signal(true)
	readonly error = signal<string | null>(null)
	readonly commentsVisible = signal(false)
	readonly activeMediaIdx = signal(0)

	readonly primaryMedia = computed(() => {
		const post = this.post()
		if (!post) return null
		return post.media[this.activeMediaIdx()] ?? post.media[0] ?? null
	})

	readonly authorName = computed(() => {
		const p = this.post()
		if (!p) return ''
		return p.author.name || p.author.username || 'Chef anónimo'
	})
	readonly authorHandle = computed(() => {
		const username = this.post()?.author.username
		return username ? `@${username}` : ''
	})
	readonly profileLink = computed(() => {
		const username = this.post()?.author.username
		return username ? ['/profile', username] : ['/profile']
	})
	readonly difficultyLabel = computed(() => {
		const map: Record<string, string> = { EASY: 'Fácil', MEDIUM: 'Media', HARD: 'Difícil' }
		return this.post()?.recipe?.difficulty ? map[this.post()!.recipe!.difficulty!] : null
	})

	ngOnInit(): void {
		const id = this.route.snapshot.paramMap.get('id')
		if (!id) {
			this.router.navigate(['/'])
			return
		}
		this.feedService.getPostById(id).subscribe({
			next: post => {
				this.post.set(post)
				this.loading.set(false)
			},
			error: err => {
				this.error.set(err.message ?? 'No se pudo cargar el post')
				this.loading.set(false)
			},
		})
	}

	goBack(): void {
		this.location.back()
	}

	toggleLike(): void {
		const post = this.post()
		if (!post) return
		this.feedStore.toggleLike(post)
		this.post.update(p => p ? {
			...p,
			liked: !p.liked,
			likesCount: p.liked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
		} : p)
	}

	toggleSave(): void {
		const post = this.post()
		if (!post) return
		this.feedStore.toggleSave(post)
		this.post.update(p => p ? {
			...p,
			saved: !p.saved,
			savesCount: p.saved ? Math.max(0, p.savesCount - 1) : p.savesCount + 1,
		} : p)
	}
}
