import { inject, Injectable } from '@angular/core'
import { from, Observable } from 'rxjs'
import { FeedService } from '@core/services/feed.service'
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
	private readonly feedSvc = inject(FeedService)

	getExplorePosts(
		categories: PostCategory[] | null,
		limit = 24,
		after?: string | null,
	): Observable<ExplorePage> {
		return from(this.fetchExplorePosts(categories, limit, after))
	}

	// Explore se sirve desde `discoverFeed` GraphQL. Acepta una categoría
	// opcional (string del enum PostCategory) que el backend filtra en SQL.
	// Sólo enviamos la primera de las solicitadas — el resolver es single-value.
	private async fetchExplorePosts(
		categories: PostCategory[] | null,
		limit: number,
		after?: string | null,
	): Promise<ExplorePage> {
		const offset = after ? Number(after) || 0 : 0
		const category = categories?.[0] ?? null
		const posts = await this.feedSvc.fetchDiscoverGql(limit, offset, category)
		const hasNextPage = posts.length === limit
		const endCursor = hasNextPage ? String(offset + limit) : null
		return { posts, endCursor, hasNextPage, totalCount: posts.length }
	}
}
