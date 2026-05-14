import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { User } from '@core/models/user/User'
import { Post, Recipe, RecipeStep } from '@core/models/post/post.model'
import { SupabaseService } from '@core/services/supabase.service'

export interface PublicUser extends User {
	isFollowedByCurrentUser: boolean
}

export interface UserPostsPage {
	posts: Post[]
	endCursor: string | null
	hasNextPage: boolean
	totalCount: number
}

// ── Supabase row shapes ───────────────────────────────────────────────────────
interface SbMediaRow   { id: string; media_url: string; media_type: string; position: number }
interface SbIngRow     { quantity: number; notes: string | null; ingredients: { id: string; name: string; unit: string } | null }
interface SbRecipeRow  { id: string; name: string; description: string | null; steps: string; time_required: number | null; estimated_cost: number | null; servings: number | null; difficulty: string | null; recipe_ingredients?: SbIngRow[] }
interface SbProfileRow { username: string; full_name: string | null; photo_url: string | null }
interface SbAuthorRow  { id: string; person_profiles: SbProfileRow[] }
interface SbPostRow    { id: string; post_type: string; title: string | null; description: string | null; created_at: string; updated_at: string; likes_count: number; comments_count: number; views_count: number; saves_count: number; media: SbMediaRow[] | null; recipe: SbRecipeRow | SbRecipeRow[] | null; author: SbAuthorRow | SbAuthorRow[] | null }

const POST_SELECT = `
	id, post_type, title, description, created_at, updated_at,
	likes_count, comments_count, views_count, saves_count,
	media:post_media(id, media_url, media_type, position),
	recipe:recipes(id, name, description, steps, time_required, estimated_cost, servings, difficulty,
		recipe_ingredients(quantity, notes, ingredients(id, name, unit))
	),
	author:users!posts_user_id_fkey(id, person_profiles(username, full_name, photo_url))
`

@Injectable({ providedIn: 'root' })
export class UserService {
	private readonly supabase = inject(SupabaseService)

	getUserByUsername(username: string): Observable<PublicUser | null> {
		return from(this.fetchUserByUsername(username))
	}

	getUserById(userId: string): Observable<{ data: User }> {
		return from(
			this.supabase.client
				.from('users')
				.select('id, posts_count, followers_count, following_count')
				.eq('id', userId)
				.maybeSingle(),
		).pipe(
			map(({ data, error }) => {
				if (error) throw new Error(error.message)
				if (!data) throw new Error('Usuario no encontrado')
				const row = data as { id: string; posts_count: number | null; followers_count: number | null; following_count: number | null }
				return {
					data: {
						id: row.id,
						email: '',
						username: '',
						fullName: null,
						photo_url: null,
						bio: null,
						location: null,
						birth_date: null,
						postsCount: row.posts_count ?? null,
						followersCount: row.followers_count ?? null,
						followingCount: row.following_count ?? null,
					} as User,
				}
			}),
		)
	}

	getUserPosts(userId: string, limit = 12): Observable<UserPostsPage> {
		return from(
			this.supabase.client
				.from('posts')
				.select(POST_SELECT)
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(limit),
		).pipe(
			map(({ data, error }) => {
				if (error) throw new Error(error.message)
				const posts = ((data ?? []) as unknown as SbPostRow[]).map(r => this.mapPost(r))
				return { posts, endCursor: null, hasNextPage: false, totalCount: posts.length }
			}),
		)
	}

	/** Insert or delete a row in `follows`. Returns the new following state. */
	toggleFollow(targetUserId: string, currentlyFollowing: boolean): Observable<boolean> {
		return from(this.doToggleFollow(targetUserId, currentlyFollowing))
	}

	private async doToggleFollow(targetId: string, isFollowing: boolean): Promise<boolean> {
		const { data: auth } = await this.supabase.client.auth.getUser()
		const myId = auth.user?.id
		if (!myId) throw new Error('No autenticado')

		if (isFollowing) {
			const { error } = await this.supabase.client
				.from('follows')
				.delete()
				.eq('follower_id', myId)
				.eq('followed_id', targetId)
			if (error) throw new Error(error.message)
			return false
		} else {
			const { error } = await this.supabase.client
				.from('follows')
				.insert({ follower_id: myId, followed_id: targetId })
			if (error) throw new Error(error.message)
			return true
		}
	}

	private async fetchUserByUsername(username: string): Promise<PublicUser | null> {
		const { data, error } = await this.supabase.client
			.from('person_profiles')
			.select('user_id, username, full_name, photo_url, bio, location, users!inner(posts_count, followers_count, following_count)')
			.eq('username', username)
			.single()

		if (error || !data) return null

		const raw = data as {
			user_id: string; username: string; full_name: string | null; photo_url: string | null
			bio: string | null; location: string | null
			users: { posts_count: number | null; followers_count: number | null; following_count: number | null } | { posts_count: number | null; followers_count: number | null; following_count: number | null }[] | null
		}
		const counts = Array.isArray(raw.users) ? raw.users[0] : raw.users
		const row = {
			user_id: raw.user_id, username: raw.username, full_name: raw.full_name, photo_url: raw.photo_url,
			bio: raw.bio, location: raw.location,
			posts_count: counts?.posts_count ?? null,
			followers_count: counts?.followers_count ?? null,
			following_count: counts?.following_count ?? null,
		}

		const { data: authData } = await this.supabase.client.auth.getUser()
		const currentUserId = authData.user?.id ?? null
		let isFollowedByCurrentUser = false

		if (currentUserId && currentUserId !== row.user_id) {
			const { data: follow } = await this.supabase.client
				.from('follows')
				.select('follower_id')
				.eq('follower_id', currentUserId)
				.eq('followed_id', row.user_id)
				.maybeSingle()
			isFollowedByCurrentUser = !!follow
		}

		return {
			id: row.user_id, email: '', username: row.username,
			fullName: row.full_name ?? null, photo_url: row.photo_url ?? null,
			bio: row.bio ?? null, location: row.location ?? null, birth_date: null,
			postsCount: row.posts_count ?? null, followersCount: row.followers_count ?? null,
			followingCount: row.following_count ?? null, isFollowedByCurrentUser,
		}
	}

	private mapPost(row: SbPostRow): Post {
		const authorUser = Array.isArray(row.author) ? row.author[0]  : row.author
		const profile    = authorUser?.person_profiles?.[0] ?? null
		const recipeRaw  = Array.isArray(row.recipe) ? row.recipe[0]  : row.recipe

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
				id:       authorUser?.id  ?? '',
				name:     profile?.full_name  ?? null,
				username: profile?.username   ?? null,
				photoUrl: profile?.photo_url  ?? null,
			},
			postType: row.post_type as Post['postType'],
			title: row.title ?? null, description: row.description ?? null,
			categories: [], media, recipe,
			likesCount: row.likes_count ?? 0, commentsCount: row.comments_count ?? 0,
			viewsCount: row.views_count ?? 0, savesCount: row.saves_count ?? 0,
			liked: false, saved: false,
			createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
		}
	}
}
