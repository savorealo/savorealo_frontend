import { inject, Injectable } from '@angular/core'
import { from, Observable } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import { FeedService, POST_SELECT } from '@core/services/feed.service'
import { Post } from '@core/models/post/post.model'
import { PostCategory } from '@core/models/post/post.dto'

export interface ExplorePage {
	posts: Post[]
	endCursor: string | null
	hasNextPage: boolean
	totalCount: number
}

@Injectable({ providedIn: 'root' })
export class ExploreService {
	private readonly supabase = inject(SupabaseService)
	private readonly feedSvc  = inject(FeedService)

	getExplorePosts(
		categories: PostCategory[] | null,
		limit = 24,
		_after?: unknown,
	): Observable<ExplorePage> {
		return from(this.fetchExplorePosts(categories, limit))
	}

	private async fetchExplorePosts(categories: PostCategory[] | null, limit: number): Promise<ExplorePage> {
		const { data: auth } = await this.supabase.client.auth.getUser()
		const userId = auth.user?.id ?? null

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let query: any = this.supabase.client
			.from('posts')
			.select(POST_SELECT)
			.order('created_at', { ascending: false })
			.limit(limit)

		if (categories?.length) {
			query = query.in('post_type', categories)
		}

		const { data, error } = await query
		if (error) throw new Error((error as { message: string }).message)

		const rows = (data ?? []) as Parameters<FeedService['mapPost']>[0][]
		const postIds = rows.map(r => r.id)

		let liked = new Set<string>()
		let saved = new Set<string>()

		if (userId && postIds.length) {
			const [likedRes, savedRes] = await Promise.all([
				this.supabase.client.from('likes').select('post_id').eq('user_id', userId).in('post_id', postIds),
				this.supabase.client.from('saved_posts').select('post_id').eq('user_id', userId).in('post_id', postIds),
			])
			liked = new Set(((likedRes.data ?? []) as { post_id: string }[]).map(r => r.post_id))
			saved = new Set(((savedRes.data ?? []) as { post_id: string }[]).map(r => r.post_id))
		}

		const posts: Post[] = rows.map(r => this.feedSvc.mapPost(r, liked.has(r.id), saved.has(r.id)))
		return { posts, endCursor: null, hasNextPage: false, totalCount: posts.length }
	}
}
