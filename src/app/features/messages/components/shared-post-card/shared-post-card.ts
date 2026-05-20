import { Component, computed, effect, inject, input, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Post, PostMedia } from '@core/models/post/post.model'
import { User } from '@core/models/user/User'
import { FeedService } from '@core/services/feed.service'
import { SupabaseService } from '@core/services/supabase.service'
import { UserService } from '@core/services/user.service'

interface SharedPostPreview {
	id: string
	title: string | null
	description: string | null
	media: PostMedia[]
}

interface DirectPostRow {
	id: string
	title: string | null
	description: string | null
	post_media: { id: string; media_url: string; media_type: string; position: number }[] | null
}

@Component({
	selector: 'app-shared-post-card',
	imports: [RouterLink],
	templateUrl: './shared-post-card.html',
})
export class SharedPostCard {
	private readonly feed = inject(FeedService)
	private readonly supabase = inject(SupabaseService)
	private readonly users = inject(UserService)

	postId = input.required<string>()
	authorId = input<string | null>(null)

	readonly post = signal<Post | null>(null)
	readonly preview = signal<SharedPostPreview | null>(null)
	readonly author = signal<User | null>(null)
	readonly loading = signal(true)
	readonly locked = signal(false)

	readonly media = computed(() => this.post()?.media[0] ?? this.preview()?.media[0] ?? null)
	readonly title = computed(() => this.post()?.title || this.post()?.description || this.preview()?.title || this.preview()?.description || 'Post compartido')
	readonly authorName = computed(() => {
		const postAuthor = this.post()?.author
		if (postAuthor) return postAuthor.name || postAuthor.username || 'Perfil'
		const author = this.author()
		return author?.fullName || author?.username || 'Perfil privado'
	})
	readonly profileLink = computed(() => {
		const username = this.post()?.author.username || this.author()?.username
		return username ? ['/profile', username] : ['/profile']
	})
	readonly postLink = computed(() => ['/post', this.postId()])

	constructor() {
		effect(() => {
			const postId = this.postId()
			if (!postId) return
			this.loadPost(postId)
		})
	}

	private loadPost(postId: string): void {
		this.loading.set(true)
		this.locked.set(false)
		this.post.set(null)
		this.preview.set(null)

		this.loadDirectPost(postId)
	}

	private async loadDirectPost(postId: string): Promise<void> {
		const { data, error } = await this.supabase.client
			.from('posts')
			.select('id, title, description, post_media(id, media_url, media_type, position)')
			.eq('id', postId)
			.maybeSingle()

		if (!error && data) {
			this.preview.set(this.mapDirectPost(data as DirectPostRow))
			this.loading.set(false)
			this.loadAuthor()
			return
		}

		this.loadPostFromFeed(postId)
	}

	private loadPostFromFeed(postId: string): void {
		this.feed.getPostById(postId).subscribe({
			next: post => {
				this.post.set(post)
				this.loading.set(false)
			},
			error: () => {
				this.loadPostFromAuthor(postId)
			},
		})
	}

	private mapDirectPost(row: DirectPostRow): SharedPostPreview {
		return {
			id: row.id,
			title: row.title,
			description: row.description,
			media: [...(row.post_media ?? [])]
				.sort((a, b) => a.position - b.position)
				.map(media => ({
					id: media.id,
					url: media.media_url,
					type: media.media_type,
					position: media.position,
				})),
		}
	}

	private loadPostFromAuthor(postId: string): void {
		const authorId = this.authorId()
		if (!authorId) {
			this.showLockedState()
			return
		}

		this.users.getUserPosts(authorId, 100).subscribe({
			next: page => {
				const post = page.posts.find(item => item.id === postId)
				if (post) {
					this.post.set(post)
					this.loading.set(false)
					return
				}
				this.showLockedState()
			},
			error: () => this.showLockedState(),
		})
	}

	private showLockedState(): void {
		this.locked.set(true)
		this.loading.set(false)
		this.loadAuthor()
	}

	private loadAuthor(): void {
		const authorId = this.authorId()
		if (!authorId) return

		this.users.getUserById(authorId).subscribe({
			next: result => this.author.set(result.data),
			error: () => this.author.set(null),
		})
	}
}
