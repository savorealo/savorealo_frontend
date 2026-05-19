import { inject, Injectable } from '@angular/core'
import { Apollo } from 'apollo-angular'
import { from, map, Observable } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import { SEARCH_USERS_QUERY } from '@graphql/feed.mutations'
import type { GqlSearchUser, ISearchRepository, SearchPostRow } from './search-repository'

@Injectable({ providedIn: 'root' })
export class SearchHybridRepository implements ISearchRepository {
	private readonly supabase = inject(SupabaseService)
	private readonly apollo   = inject(Apollo)

	searchPosts(query: string, limit: number): Observable<SearchPostRow[]> {
		return from(
			this.supabase.client
				.from('posts')
				.select('id, title, description, post_type, likes_count, comments_count, media:post_media(media_url, media_type, position)')
				.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
				.order('likes_count', { ascending: false })
				.limit(limit),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return (data ?? []) as unknown as SearchPostRow[]
			}),
		)
	}

	searchUsers(query: string, limit: number, offset: number): Observable<GqlSearchUser[]> {
		return this.apollo.query<{ searchUsers: GqlSearchUser[] }>({
			query: SEARCH_USERS_QUERY,
			variables: { q: query, limit, offset },
			fetchPolicy: 'network-only',
		}).pipe(
			map(res => res.data?.searchUsers ?? []),
		)
	}
}
