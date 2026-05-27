import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { Post, PostCategory, Recipe, RecipeStep } from '@core/models/post/post.model'
import { POST_REPOSITORY } from '@core/repositories/tokens/repository.tokens'
import type { GqlPostNode } from '@core/repositories/post/post-repository'

export type { GqlPostNode } from '@core/repositories/post/post-repository'

/**
 * Interfaz que define la estructura o contrato de datos para createpostrecipeinput.
 */
export interface CreatePostRecipeInput {
	/**
	 * Propiedad para gestionar nombre.
	 */
	name: string
	/**
	 * Propiedad para gestionar difficulty.
	 */
	difficulty?: string | null
	/**
	 * Propiedad para gestionar tiempo required.
	 */
	timeRequired?: number | null
	/**
	 * Propiedad para gestionar servings.
	 */
	servings?: number | null
	/**
	 * Propiedad para gestionar ingredients.
	 */
	ingredients: { /**
	 * Propiedad para gestionar nombre.
	 */
	/**
	 * Propiedad para gestionar nombre.
	 */
	name: string; /**
	 * Propiedad para gestionar quantity.
	 */
	/**
	 * Propiedad para gestionar quantity.
	 */
	quantity: number; /**
	 * Propiedad para gestionar unit.
	 */
	/**
	 * Propiedad para gestionar unit.
	 */
	unit: string }[]
	/**
	 * Propiedad para gestionar steps.
	 */
	steps: { /**
	 * Propiedad para gestionar order.
	 */
	/**
	 * Propiedad para gestionar order.
	 */
	order: number; /**
	 * Propiedad para gestionar text.
	 */
	/**
	 * Propiedad para gestionar text.
	 */
	text: string }[]
}

/**
 * Interfaz que define la estructura o contrato de datos para createpostinput.
 */
export interface CreatePostInput {
	/**
	 * Propiedad para gestionar título.
	 */
	title?: string | null
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string
	/**
	 * Propiedad para gestionar media enlace.
	 */
	mediaUrl?: string | null
	/**
	 * Propiedad para gestionar media type.
	 */
	mediaType?: string | null
	/**
	 * Propiedad para gestionar recipe.
	 */
	recipe?: CreatePostRecipeInput | null
}

/**
 * Componente principal para la vista o página de el feed de publicaciones.
 */
export interface FeedPage {
	/**
	 * Propiedad para gestionar posts.
	 */
	posts: Post[]
	/**
	 * Propiedad para gestionar end cursor.
	 */
	endCursor: string | null
	/**
	 * Indicador booleano para tiene next page.
	 */
	hasNextPage: boolean
	/**
	 * Propiedad para gestionar total cantidad.
	 */
	totalCount: number
}

/**
 * Interfaz que define la estructura o contrato de datos para toggleresult.
 */
export interface ToggleResult {
	/**
	 * Propiedad para gestionar active.
	 */
	active: boolean
	/**
	 * Propiedad para gestionar cantidad.
	 */
	count: number
}

/**
 * Servicio que provee la lógica de negocio para el feed de publicaciones.
 */
@Injectable({ providedIn: 'root' })
export class FeedService {
	/**
	 * Propiedad para gestionar repo.
	 */
	private readonly repo = inject(POST_REPOSITORY)

	// ── Feed ────────────────────────────────────────────────────────────────

	/**
	 * Método para obtener home feed.
	 */
	getHomeFeed(limit = 12, after?: string | null): Observable<FeedPage> {
		const offset = after ? Number(after) || 0 : 0
		return this.repo.fetchHomeFeed(limit, offset).pipe(
			map(nodes => {
				const posts = nodes.map(n => this.mapGqlPost(n))
				const hasNextPage = posts.length === limit
				const endCursor = hasNextPage ? String(offset + limit) : null
				return { posts, endCursor, hasNextPage, totalCount: posts.length }
			}),
		)
	}

	/**
	 * Método para obtener post por identificador.
	 */
	getPostById(id: string): Observable<Post> {
		return from(this.fetchPostById(id))
	}

	/**
	 * Método para obtener saved posts.
	 */
	getSavedPosts(limit = 24, cursor?: string | null): Observable<FeedPage> {
		return this.repo.fetchSavedPosts(limit, cursor ?? null).pipe(
			map(result => ({
				posts: result.posts.map(n => this.mapGqlPost(n)),
				endCursor: result.nextCursor,
				hasNextPage: result.hasNextPage,
				totalCount: result.posts.length,
			})),
		)
	}

	/**
	 * Método para obtener liked posts.
	 */
	getLikedPosts(limit = 24): Observable<FeedPage> {
		return this.repo.fetchLikedPosts(limit, 0).pipe(
			map(nodes => ({
				posts: nodes.map(n => this.mapGqlPost(n)),
				endCursor: null,
				hasNextPage: false,
				totalCount: nodes.length,
			})),
		)
	}

	/** Lee posts del backend GraphQL (discover). */
	async fetchDiscoverGql(limit: number, offset = 0, category: string | null = null): Promise<Post[]> {
		return new Promise((resolve, reject) => {
			this.repo.fetchDiscoverFeed(limit, offset, category).subscribe({
				next: nodes => resolve(nodes.map(n => this.mapGqlPost(n))),
				error: reject,
			})
		})
	}

	/** Lee guardados del usuario actual vía GraphQL (cursor-based). */
	async fetchSavedGql(limit = 24, cursor?: string | null): Promise<{ posts: Post[]; nextCursor: string | null; hasNextPage: boolean }> {
		return new Promise((resolve, reject) => {
			this.repo.fetchSavedPosts(limit, cursor ?? null).subscribe({
				next: result => resolve({
					posts: result.posts.map(n => this.mapGqlPost(n)),
					nextCursor: result.nextCursor,
					hasNextPage: result.hasNextPage,
				}),
				error: reject,
			})
		})
	}

	/** Lee los posts que le gustan al usuario actual vía GraphQL. */
	async fetchLikedGql(limit = 24, offset = 0): Promise<Post[]> {
		return new Promise((resolve, reject) => {
			this.repo.fetchLikedPosts(limit, offset).subscribe({
				next: nodes => resolve(nodes.map(n => this.mapGqlPost(n))),
				error: reject,
			})
		})
	}

	// ── Interactions ─────────────────────────────────────────────────────────

	/**
	 * Método para alternar like.
	 */
	toggleLike(postId: string): Observable<ToggleResult> {
		return this.repo.toggleLike(postId).pipe(
			map(data => ({ active: data.liked, count: data.likes })),
		)
	}

	/**
	 * Método para alternar guardar.
	 */
	toggleSave(postId: string): Observable<ToggleResult> {
		return this.repo.toggleSave(postId).pipe(
			map(data => ({ active: data.saved, count: data.saves })),
		)
	}

	// ── Create ───────────────────────────────────────────────────────────────

	/**
	 * Método para crear post.
	 */
	createPost(input: CreatePostInput): Observable<Post> {
		if (input.recipe) {
			return this.repo.createRecipePost({
				content:      input.description,
				imageUrl:     input.mediaUrl ?? null,
				recipeName:   input.recipe.name,
				difficulty:   input.recipe.difficulty ?? null,
				timeRequired: input.recipe.timeRequired ?? null,
				servings:     input.recipe.servings ?? null,
				ingredients:  input.recipe.ingredients,
				steps:        input.recipe.steps,
			}).pipe(map(node => this.mapGqlPost(node)))
		}

		return this.repo.createPost({
			content:  input.description,
			title:    input.title ?? null,
			imageUrl: input.mediaUrl ?? null,
		}).pipe(map(node => this.mapGqlPost(node)))
	}

	// ── Mapping ──────────────────────────────────────────────────────────────

	/**
	 * Método para map gql post.
	 */
	mapGqlPost(n: GqlPostNode): Post {
		const media = (n.post_media ?? [])
			.slice()
			.sort((a, b) => a.position - b.position)
			.map(m => ({ id: m.id, url: m.media_url, type: m.media_type, position: m.position }))

		let recipe: Recipe | null = null
		if (n.recipe) {
			let steps: RecipeStep[] = []
			try {
				const parsed = JSON.parse(n.recipe.steps ?? '[]')
				if (Array.isArray(parsed)) {
					steps = parsed.map((s: { step?: number; order?: number; text?: string; description?: string }, i: number) => ({
						step: s.step ?? s.order ?? i + 1,
						text: s.text ?? s.description ?? '',
					}))
				}
			} catch { steps = [] }

			recipe = {
				id: n.recipe.id, name: n.recipe.name, description: n.recipe.description ?? null,
				steps, timeRequired: n.recipe.time_required ?? null,
				estimatedCost: n.recipe.estimated_cost ?? null, servings: n.recipe.servings ?? null,
				difficulty: (n.recipe.difficulty as 'EASY' | 'MEDIUM' | 'HARD' | null) ?? null,
				ingredients: [],
			}
		}

		return {
			id: n.id, authorId: n.author?.id ?? '',
			author: {
				id:       n.author?.id ?? '',
				name:     n.author?.display_name ?? null,
				username: n.author?.username ?? null,
				photoUrl: n.author?.avatar_url ?? null,
			},
			postType:     n.post_type as Post['postType'],
			title:        n.title ?? null,
			description:  n.description ?? null,
			categories:   (n.categories ?? []) as PostCategory[],
			media, recipe,
			likesCount:    n.likes_count    ?? 0,
			commentsCount: n.comments_count ?? 0,
			viewsCount:    0,
			savesCount:    n.saves_count    ?? 0,
			liked: n.liked ?? false,
			saved: n.saved ?? false,
			createdAt: new Date(n.created_at),
			updatedAt: new Date(n.created_at),
		}
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	/**
	 * Método para fetch post por identificador.
	 */
	private async fetchPostById(id: string): Promise<Post> {
		const cached = this.repo.readPostFromCache(id)
		if (cached) return this.mapGqlPost(cached)

		const discoverHit = await this.fetchDiscoverGql(20).then(posts => posts.find(p => p.id === id))
		if (discoverHit) return discoverHit

		const savedHit = await this.fetchSavedGql(20).then(r => r.posts.find(p => p.id === id)).catch(() => null)
		if (savedHit) return savedHit

		throw new Error('No se encontró el post')
	}
}
