import { Component, computed, effect, inject, input, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Post, PostMedia } from '@core/models/post/post.model'
import { User } from '@core/models/user/User'
import { FeedService } from '@core/services/feed.service'
import { SupabaseService } from '@core/services/supabase.service'
import { UserService } from '@core/services/user.service'

/**
 * Interfaz que define la estructura o contrato de datos para sharedpostpreview.
 */
interface SharedPostPreview {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar título.
	 */
	title: string | null
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string | null
	/**
	 * Propiedad para gestionar media.
	 */
	media: PostMedia[]
}

/**
 * Interfaz que define la estructura o contrato de datos para directpostrow.
 */
interface DirectPostRow {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar título.
	 */
	title: string | null
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string | null
	/**
	 * Propiedad para gestionar post media.
	 */
	post_media: { /**
	 * Propiedad para gestionar identificador.
	 */
	id: string; /**
	 * Propiedad para gestionar media enlace.
	 */
	media_url: string; /**
	 * Propiedad para gestionar media type.
	 */
	media_type: string; /**
	 * Propiedad para gestionar position.
	 */
	position: number }[] | null
}

/**
 * Clase de utilidad para sharedpostcard.
 */
@Component({
	selector: 'app-shared-post-card',
	imports: [RouterLink],
	templateUrl: './shared-post-card.html',
})
export class SharedPostCard {
	/**
	 * Propiedad para gestionar feed.
	 */
	private readonly feed = inject(FeedService)
	/**
	 * Propiedad para gestionar supabase.
	 */
	private readonly supabase = inject(SupabaseService)
	/**
	 * Propiedad para gestionar users.
	 */
	private readonly users = inject(UserService)

	/**
	 * Propiedad para gestionar post identificador.
	 */
	postId = input.required<string>()
	/**
	 * Propiedad para gestionar author identificador.
	 */
	authorId = input<string | null>(null)

	/**
	 * Propiedad para gestionar post.
	 */
	readonly post = signal<Post | null>(null)
	/**
	 * Propiedad para gestionar preview.
	 */
	readonly preview = signal<SharedPostPreview | null>(null)
	/**
	 * Propiedad para gestionar author.
	 */
	readonly author = signal<User | null>(null)
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading = signal(true)
	/**
	 * Propiedad para gestionar locked.
	 */
	readonly locked = signal(false)

	/**
	 * Propiedad para gestionar media.
	 */
	readonly media = computed(() => this.post()?.media[0] ?? this.preview()?.media[0] ?? null)
	/**
	 * Propiedad para gestionar título.
	 */
	readonly title = computed(() => this.post()?.title || this.post()?.description || this.preview()?.title || this.preview()?.description || 'Post compartido')
	/**
	 * Propiedad para gestionar author nombre.
	 */
	readonly authorName = computed(() => {
		const postAuthor = this.post()?.author
		if (postAuthor) return postAuthor.name || postAuthor.username || 'Perfil'
		const author = this.author()
		return author?.fullName || author?.username || 'Perfil privado'
	})
	/**
	 * Propiedad para gestionar profile enlace.
	 */
	readonly profileLink = computed(() => {
		const username = this.post()?.author.username || this.author()?.username
		return username ? ['/profile', username] : ['/profile']
	})
	/**
	 * Propiedad para gestionar post enlace.
	 */
	readonly postLink = computed(() => ['/post', this.postId()])

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
	constructor() {
		effect(() => {
			const postId = this.postId()
			if (!postId) return
			this.loadPost(postId)
		})
	}

	/**
	 * Método para cargar post.
	 */
	private loadPost(postId: string): void {
		this.loading.set(true)
		this.locked.set(false)
		this.post.set(null)
		this.preview.set(null)

		this.loadDirectPost(postId)
	}

	/**
	 * Método para cargar direct post.
	 */
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

	/**
	 * Método para cargar post from feed.
	 */
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

	/**
	 * Método para map direct post.
	 */
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

	/**
	 * Método para cargar post from author.
	 */
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

	/**
	 * Método para mostrar locked estado.
	 */
	private showLockedState(): void {
		this.locked.set(true)
		this.loading.set(false)
		this.loadAuthor()
	}

	/**
	 * Método para cargar author.
	 */
	private loadAuthor(): void {
		const authorId = this.authorId()
		if (!authorId) return

		this.users.getUserById(authorId).subscribe({
			next: result => this.author.set(result.data),
			error: () => this.author.set(null),
		})
	}
}
