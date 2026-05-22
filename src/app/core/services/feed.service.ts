import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { Post, PostCategory, Recipe, RecipeStep } from '@core/models/post/post.model'
import { POST_REPOSITORY } from '@core/repositories/tokens/repository.tokens'
import type { GqlPostNode } from '@core/repositories/post/post-repository'

export type { GqlPostNode } from '@core/repositories/post/post-repository'

export interface CreatePostRecipeInput {
	name: string
	difficulty?: string | null
	timeRequired?: number | null
	servings?: number | null
	ingredients: { name: string; quantity: number; unit: string }[]
	steps: { order: number; text: string }[]
}

export interface CreatePostInput {
	title?: string | null
	description: string
	mediaUrl?: string | null
	mediaType?: string | null
	recipe?: CreatePostRecipeInput | null
}

export interface FeedPage {
	posts: Post[]
	endCursor: string | null
	hasNextPage: boolean
	totalCount: number
}

export interface ToggleResult {
	active: boolean
	count: number
}

@Injectable({ providedIn: 'root' })
export class FeedService {
	private readonly repo = inject(POST_REPOSITORY)

	// ── Feed ────────────────────────────────────────────────────────────────

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

	getPostById(id: string): Observable<Post> {
		return from(this.fetchPostById(id))
	}

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

	toggleLike(postId: string): Observable<ToggleResult> {
		return this.repo.toggleLike(postId).pipe(
			map(data => ({ active: data.liked, count: data.likes })),
		)
	}

	toggleSave(postId: string): Observable<ToggleResult> {
		return this.repo.toggleSave(postId).pipe(
			map(data => ({ active: data.saved, count: data.saves })),
		)
	}

	// ── Create ───────────────────────────────────────────────────────────────

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
