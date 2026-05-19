import { inject, Injectable } from '@angular/core'
import { firstValueFrom, from, Observable } from 'rxjs'
import { Apollo } from 'apollo-angular'
import { Post, PostCategory, Recipe, RecipeStep } from '@core/models/post/post.model'
import { SupabaseService } from '@core/services/supabase.service'
import { DISCOVER_FEED_QUERY, HOME_FEED_QUERY, LIKED_POSTS_QUERY, POST_CARD_FRAGMENT, SAVED_POSTS_QUERY, TOGGLE_LIKE_MUTATION, TOGGLE_SAVE_MUTATION } from '@graphql/feed.mutations'

// ── GraphQL post shape (PostCardFields fragment) ──────────────────────────────
export interface GqlPostNode {
	id: string
	post_type: string
	title: string | null
	description: string | null
	created_at: string
	likes_count: number
	comments_count: number
	saves_count: number
	liked?: boolean
	saved?: boolean
	categories?: string[] | null
	author: { id: string; username: string | null; display_name: string | null; avatar_url: string | null } | null
	post_media: { id: string; media_url: string; media_type: string; position: number }[] | null
	recipe: { id: string; name: string; description: string | null; steps: string | null; time_required: number | null; estimated_cost: number | null; servings: number | null; difficulty: string | null } | null
}

export interface CreatePostInput {
	title?: string | null
	description: string
	mediaUrl?: string | null
	mediaType?: string | null
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
	private readonly supabase = inject(SupabaseService)
	private readonly apollo   = inject(Apollo)

	/** Lee posts del backend GraphQL (tiene los permisos service_role). */
	async fetchDiscoverGql(limit: number, offset = 0, category: string | null = null): Promise<Post[]> {
		const res = await firstValueFrom(
			this.apollo.query<{ discoverFeed: GqlPostNode[] }>({
				query: DISCOVER_FEED_QUERY,
				variables: { limit, offset, category: category ?? undefined },
				fetchPolicy: 'network-only',
			}),
		)
		return (res.data?.discoverFeed ?? []).map(n => this.mapGqlPost(n))
	}

	/** Lee guardados del usuario actual vía GraphQL (cursor-based). */
	async fetchSavedGql(limit = 24, cursor?: string | null): Promise<{ posts: Post[]; nextCursor: string | null; hasNextPage: boolean }> {
		const res = await firstValueFrom(
			this.apollo.query<{ savedPosts: { posts: GqlPostNode[]; nextCursor: string | null; hasNextPage: boolean } }>({
				query: SAVED_POSTS_QUERY,
				variables: { limit, cursor: cursor ?? undefined },
				fetchPolicy: 'network-only',
			}),
		)
		const data = res.data?.savedPosts
		return {
			posts: (data?.posts ?? []).map(n => this.mapGqlPost(n)),
			nextCursor: data?.nextCursor ?? null,
			hasNextPage: data?.hasNextPage ?? false,
		}
	}

	/** Mapea la forma GraphQL (PostCardFields) al modelo Post. */
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

	// ── Feed ────────────────────────────────────────────────────────────────

	getHomeFeed(limit = 12, after?: string | null): Observable<FeedPage> {
		return from(this.fetchHomeFeed(limit, after))
	}

	getPostById(id: string): Observable<Post> {
		return from(this.fetchPostById(id))
	}

	getSavedPosts(limit = 24, cursor?: string | null): Observable<FeedPage> {
		return from(this.fetchSavedPosts(limit, cursor))
	}

	getLikedPosts(limit = 24): Observable<FeedPage> {
		return from(this.fetchLikedPosts(limit))
	}

	/** Lee los posts que le gustan al usuario actual vía GraphQL. */
	async fetchLikedGql(limit = 24, offset = 0): Promise<Post[]> {
		const res = await firstValueFrom(
			this.apollo.query<{ likedPosts: GqlPostNode[] }>({
				query: LIKED_POSTS_QUERY,
				variables: { limit, offset },
				fetchPolicy: 'network-only',
			}),
		)
		return (res.data?.likedPosts ?? []).map(n => this.mapGqlPost(n))
	}

	// ── Interactions ─────────────────────────────────────────────────────────

	toggleLike(postId: string): Observable<ToggleResult> {
		return from(this.doToggleLike(postId))
	}

	toggleSave(postId: string): Observable<ToggleResult> {
		return from(this.doToggleSave(postId))
	}

	// ── Create ───────────────────────────────────────────────────────────────

	createPost(input: CreatePostInput): Observable<Post> {
		return from(this.doCreatePost(input))
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	private async fetchHomeFeed(limit: number, after?: string | null): Promise<FeedPage> {
		const offset = after ? Number(after) || 0 : 0
		const res = await firstValueFrom(
			this.apollo.query<{ feed: GqlPostNode[] }>({
				query: HOME_FEED_QUERY,
				variables: { limit, offset },
				fetchPolicy: 'network-only',
			}),
		)
		const posts = (res.data?.feed ?? []).map(n => this.mapGqlPost(n))
		const hasNextPage = posts.length === limit
		const endCursor = hasNextPage ? String(offset + limit) : null
		return { posts, endCursor, hasNextPage, totalCount: posts.length }
	}

	// El backend aún no expone `post(id)` como query GraphQL singular y el
	// embed Supabase de `post_media` falla con "permission denied" (falta GRANT).
	// Buscamos el post siempre con network-only en discoverFeed / savedPosts para
	// evitar que la caché devuelva valores viewer-relativos obsoletos (liked/saved
	// con el dev-fallback del backend). El caché de Apollo NO se lee directamente
	// para `liked`/`saved` ya que esos campos dependen de la sesión del usuario.
	private async fetchPostById(id: string): Promise<Post> {
		// Try discover feed first (covers most navigation paths)
		const discoverHit = await this.fetchDiscoverGql(50).then(posts => posts.find(p => p.id === id))
		if (discoverHit) return discoverHit

		const savedHit = await this.fetchSavedGql(50).then(r => r.posts.find(p => p.id === id)).catch(() => null)
		if (savedHit) return savedHit

		// Last resort: read from cache (non-viewer-relative fields only, liked/saved default to false)
		const cached = this.readPostFromApolloCache(id)
		if (cached) return { ...cached, liked: false, saved: false }

		throw new Error('No se encontró el post')
	}

	private readPostFromApolloCache(id: string): Post | null {
		try {
			const node = this.apollo.client.cache.readFragment<GqlPostNode>({
				id: this.apollo.client.cache.identify({ __typename: 'posts', id }) ?? `posts:${id}`,
				fragment: POST_CARD_FRAGMENT,
				fragmentName: 'PostCardFields',
			})
			if (!node || !node.id) return null
			return this.mapGqlPost(node)
		} catch {
			return null
		}
	}

	private async fetchSavedPosts(limit: number, cursor?: string | null): Promise<FeedPage> {
		const result = await this.fetchSavedGql(limit, cursor)
		return { posts: result.posts, endCursor: result.nextCursor, hasNextPage: result.hasNextPage, totalCount: result.posts.length }
	}

	private async fetchLikedPosts(limit: number): Promise<FeedPage> {
		const posts = await this.fetchLikedGql(limit)
		return { posts, endCursor: null, hasNextPage: false, totalCount: posts.length }
	}

	private async doToggleLike(postId: string): Promise<ToggleResult> {
		const res = await firstValueFrom(
			this.apollo.mutate<{ toggleLike: { postId: string; liked: boolean; likes: number } }>({
				mutation: TOGGLE_LIKE_MUTATION,
				variables: { postId },
				update: (cache, { data }) => {
					const result = data?.toggleLike
					if (!result) return
					cache.modify({
						id: cache.identify({ __typename: 'posts', id: postId }),
						fields: {
							liked: () => result.liked,
							likes_count: () => result.likes,
						},
					})
				},
			}),
		)
		const data = res.data?.toggleLike
		return { active: !!data?.liked, count: data?.likes ?? 0 }
	}

	private async doToggleSave(postId: string): Promise<ToggleResult> {
		const res = await firstValueFrom(
			this.apollo.mutate<{ toggleSave: { postId: string; saved: boolean } }>({
				mutation: TOGGLE_SAVE_MUTATION,
				variables: { postId },
				update: (cache, { data }) => {
					const result = data?.toggleSave
					if (!result) return
					cache.modify({
						id: cache.identify({ __typename: 'posts', id: postId }),
						fields: {
							saved: () => result.saved,
						},
					})
				},
			}),
		)
		return { active: !!res.data?.toggleSave?.saved, count: 0 }
	}

	private async doCreatePost(input: CreatePostInput): Promise<Post> {
		const { data: auth } = await this.supabase.client.auth.getUser()
		const userId = auth.user?.id
		if (!userId) throw new Error('No autenticado')

		const { data: post, error } = await this.supabase.client
			.from('posts')
			.insert({
				user_id:     userId,
				description: input.description,
				title:       input.title ?? null,
				post_type:   'POST',
			})
			.select('id')
			.single()

		if (error) throw new Error(error.message)
		const postId = (post as { id: string }).id

		if (input.mediaUrl) {
			await this.supabase.client.from('post_media').insert({
				post_id:    postId,
				media_url:  input.mediaUrl,
				media_type: input.mediaType ?? 'image',
				position:   0,
			})
		}

		// Return full post
		return this.fetchPostById(postId)
	}

}
