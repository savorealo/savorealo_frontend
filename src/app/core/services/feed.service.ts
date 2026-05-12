import { inject, Injectable } from '@angular/core'
import { from, Observable } from 'rxjs'
import { Post, Recipe, RecipeStep } from '@core/models/post/post.model'
import { SupabaseService } from '@core/services/supabase.service'

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

// ── Supabase row shapes ───────────────────────────────────────────────────────
interface SbMediaRow    { id: string; media_url: string; media_type: string; position: number }
interface SbIngRow      { quantity: number; notes: string | null; ingredients: { id: string; name: string; unit: string } | null }
interface SbRecipeRow   { id: string; name: string; description: string | null; steps: string; time_required: number | null; estimated_cost: number | null; servings: number | null; difficulty: string | null; recipe_ingredients?: SbIngRow[] }
interface SbProfileRow  { username: string; full_name: string | null; photo_url: string | null }
interface SbAuthorRow   { id: string; person_profiles: SbProfileRow[] }
interface SbPostRow     { id: string; post_type: string; title: string | null; description: string | null; created_at: string; updated_at: string; likes_count: number; comments_count: number; views_count: number; saves_count: number; media: SbMediaRow[] | null; recipe: SbRecipeRow | SbRecipeRow[] | null; author: SbAuthorRow | SbAuthorRow[] | null }

export const POST_SELECT = `
	id, post_type, title, description, created_at, updated_at,
	likes_count, comments_count, views_count, saves_count,
	media:post_media(id, media_url, media_type, position),
	recipe:recipes(id, name, description, steps, time_required, estimated_cost, servings, difficulty,
		recipe_ingredients(quantity, notes, ingredients(id, name, unit))
	),
	author:users!posts_user_id_fkey(id, person_profiles(username, full_name, photo_url))
`

@Injectable({ providedIn: 'root' })
export class FeedService {
	private readonly supabase = inject(SupabaseService)

	// ── Feed ────────────────────────────────────────────────────────────────

	getHomeFeed(limit = 12, after?: string | null): Observable<FeedPage> {
		return from(this.fetchHomeFeed(limit, after))
	}

	getPostById(id: string): Observable<Post> {
		return from(this.fetchPostById(id))
	}

	getSavedPosts(limit = 24): Observable<FeedPage> {
		return from(this.fetchSavedPosts(limit))
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
		const { data: auth } = await this.supabase.client.auth.getUser()
		const userId = auth.user?.id
		if (!userId) return { posts: [], endCursor: null, hasNextPage: false, totalCount: 0 }

		// Get followed user IDs
		const { data: follows } = await this.supabase.client
			.from('follows')
			.select('followed_id')
			.eq('follower_id', userId)

		const followedIds = ((follows ?? []) as { followed_id: string }[]).map(f => f.followed_id)
		const authorIds   = [...new Set([...followedIds, userId])]

		// Fetch limit+1 rows to determine if there's a next page
		let query = this.supabase.client
			.from('posts')
			.select(POST_SELECT)
			.in('user_id', authorIds)
			.order('created_at', { ascending: false })
			.limit(limit + 1)

		// Cursor pagination: fetch rows older than the cursor timestamp
		if (after) query = query.lt('created_at', after)

		const { data, error } = await query
		if (error) throw new Error(error.message)

		let rows = (data ?? []) as unknown as SbPostRow[]

		// ── Fallback: si el usuario no sigue a nadie y no tiene posts propios,
		//    mostramos los posts más recientes de toda la plataforma ──────────────
		if (!rows.length && !after) {
			let fallbackQuery = this.supabase.client
				.from('posts')
				.select(POST_SELECT)
				.order('created_at', { ascending: false })
				.limit(limit + 1)
			const { data: trending } = await fallbackQuery
			rows = (trending ?? []) as unknown as SbPostRow[]
		}

		const hasNextPage = rows.length > limit
		if (hasNextPage) rows = rows.slice(0, limit)

		// Batch-fetch liked & saved state
		const postIds = rows.map(r => r.id)
		const liked   = await this.getLikedSet(userId, postIds)
		const saved   = await this.getSavedSet(userId, postIds)

		const posts    = rows.map(r => this.mapPost(r, liked.has(r.id), saved.has(r.id)))
		const endCursor = posts.length > 0 ? posts[posts.length - 1].createdAt.toISOString() : null

		return { posts, endCursor, hasNextPage, totalCount: posts.length }
	}

	private async fetchPostById(id: string): Promise<Post> {
		const { data: auth } = await this.supabase.client.auth.getUser()
		const userId = auth.user?.id ?? null

		const { data, error } = await this.supabase.client
			.from('posts')
			.select(POST_SELECT)
			.eq('id', id)
			.single()

		if (error) throw new Error(error.message)

		const liked = userId ? await this.getLikedSet(userId, [id]) : new Set<string>()
		const saved = userId ? await this.getSavedSet(userId, [id]) : new Set<string>()

		return this.mapPost(data as unknown as SbPostRow, liked.has(id), saved.has(id))
	}

	private async fetchSavedPosts(limit: number): Promise<FeedPage> {
		const { data: auth } = await this.supabase.client.auth.getUser()
		const userId = auth.user?.id
		if (!userId) return { posts: [], endCursor: null, hasNextPage: false, totalCount: 0 }

		const { data: saves, error: savesErr } = await this.supabase.client
			.from('saved_posts')
			.select('post_id')
			.eq('user_id', userId)
			.order('saved_at', { ascending: false })
			.limit(limit)

		if (savesErr) throw new Error(savesErr.message)
		const postIds = ((saves ?? []) as { post_id: string }[]).map(s => s.post_id)
		if (!postIds.length) return { posts: [], endCursor: null, hasNextPage: false, totalCount: 0 }

		const { data, error } = await this.supabase.client
			.from('posts')
			.select(POST_SELECT)
			.in('id', postIds)

		if (error) throw new Error(error.message)
		const liked = await this.getLikedSet(userId, postIds)
		const posts = ((data ?? []) as unknown as SbPostRow[]).map(r => this.mapPost(r, liked.has(r.id), true))
		return { posts, endCursor: null, hasNextPage: false, totalCount: posts.length }
	}

	private async doToggleLike(postId: string): Promise<ToggleResult> {
		const { data: auth } = await this.supabase.client.auth.getUser()
		const userId = auth.user?.id
		if (!userId) throw new Error('No autenticado')

		const { data: existing } = await this.supabase.client
			.from('likes')
			.select('user_id')
			.eq('user_id', userId)
			.eq('post_id', postId)
			.maybeSingle()

		if (existing) {
			await this.supabase.client.from('likes').delete().eq('user_id', userId).eq('post_id', postId)
		} else {
			await this.supabase.client.from('likes').insert({ user_id: userId, post_id: postId })
		}

		const { data: post } = await this.supabase.client
			.from('posts').select('likes_count').eq('id', postId).single()
		const count = (post as { likes_count: number } | null)?.likes_count ?? 0

		return { active: !existing, count }
	}

	private async doToggleSave(postId: string): Promise<ToggleResult> {
		const { data: auth } = await this.supabase.client.auth.getUser()
		const userId = auth.user?.id
		if (!userId) throw new Error('No autenticado')

		const { data: existing } = await this.supabase.client
			.from('saved_posts')
			.select('user_id')
			.eq('user_id', userId)
			.eq('post_id', postId)
			.maybeSingle()

		if (existing) {
			await this.supabase.client.from('saved_posts').delete().eq('user_id', userId).eq('post_id', postId)
		} else {
			await this.supabase.client.from('saved_posts').insert({ user_id: userId, post_id: postId })
		}

		return { active: !existing, count: 0 }
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

	// ── Helpers ───────────────────────────────────────────────────────────────

	private async getLikedSet(userId: string, postIds: string[]): Promise<Set<string>> {
		if (!postIds.length) return new Set()
		const { data } = await this.supabase.client
			.from('likes').select('post_id').eq('user_id', userId).in('post_id', postIds)
		return new Set(((data ?? []) as { post_id: string }[]).map(r => r.post_id))
	}

	private async getSavedSet(userId: string, postIds: string[]): Promise<Set<string>> {
		if (!postIds.length) return new Set()
		const { data } = await this.supabase.client
			.from('saved_posts').select('post_id').eq('user_id', userId).in('post_id', postIds)
		return new Set(((data ?? []) as { post_id: string }[]).map(r => r.post_id))
	}

	// ── Mapper ────────────────────────────────────────────────────────────────

	mapPost(row: SbPostRow, liked = false, saved = false): Post {
		const authorUser = Array.isArray(row.author)  ? row.author[0]  : row.author
		const profile    = authorUser?.person_profiles?.[0] ?? null
		const recipeRaw  = Array.isArray(row.recipe)  ? row.recipe[0]  : row.recipe

		const media = ((row.media ?? []) as SbMediaRow[])
			.sort((a, b) => a.position - b.position)
			.map(m => ({ id: m.id, url: m.media_url, type: m.media_type, position: m.position }))

		let recipe: Recipe | null = null
		if (recipeRaw) {
			let steps: RecipeStep[] = []
			try {
				const parsed = JSON.parse(recipeRaw.steps ?? '[]')
				if (Array.isArray(parsed)) {
					steps = parsed.map((s: { step?: number; order?: number; text?: string; description?: string }, i: number) => ({
						step: s.step ?? s.order ?? i + 1,
						text: s.text ?? s.description ?? '',
					}))
				}
			} catch { steps = [] }

			recipe = {
				id: recipeRaw.id, name: recipeRaw.name, description: recipeRaw.description ?? null,
				steps, timeRequired: recipeRaw.time_required ?? null,
				estimatedCost: recipeRaw.estimated_cost ?? null, servings: recipeRaw.servings ?? null,
				difficulty: (recipeRaw.difficulty as 'EASY' | 'MEDIUM' | 'HARD' | null) ?? null,
				ingredients: ((recipeRaw.recipe_ingredients ?? []) as SbIngRow[]).map(ri => ({
					ingredientId: ri.ingredients?.id ?? '', name: ri.ingredients?.name ?? '',
					unit: ri.ingredients?.unit ?? '', quantity: ri.quantity, notes: ri.notes,
				})),
			}
		}

		return {
			id: row.id, authorId: authorUser?.id ?? '',
			author: {
				id:       authorUser?.id ?? '',
				name:     profile?.full_name ?? null,
				username: profile?.username  ?? null,
				photoUrl: profile?.photo_url ?? null,
			},
			postType:     row.post_type as Post['postType'],
			title:        row.title ?? null,
			description:  row.description ?? null,
			categories:   [],
			media, recipe,
			likesCount:    row.likes_count    ?? 0,
			commentsCount: row.comments_count ?? 0,
			viewsCount:    row.views_count    ?? 0,
			savesCount:    row.saves_count    ?? 0,
			liked, saved,
			createdAt: new Date(row.created_at),
			updatedAt: new Date(row.updated_at),
		}
	}
}
