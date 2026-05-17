import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { Apollo } from 'apollo-angular'
import { SupabaseService } from '@core/services/supabase.service'
import { SEARCH_USERS_QUERY } from '@graphql/feed.mutations'

export interface SearchPost {
	id: string
	title: string | null
	description: string | null
	postType: string
	likesCount: number
	commentsCount: number
	thumbnailUrl: string | null
	thumbnailType: string | null
}

export interface SearchUser {
	userId: string
	username: string
	fullName: string | null
	photoUrl: string | null
	bio: string | null
	followersCount: number
	isFollowing: boolean
}

interface GqlSearchUser {
	id: string
	username: string | null
	display_name: string | null
	avatar_url: string | null
	followers_count: number | null
	isFollowing: boolean | null
}

interface PostRow {
	id: string
	title: string | null
	description: string | null
	post_type: string
	likes_count: number
	comments_count: number
	media: { media_url: string; media_type: string; position: number }[]
}

@Injectable({ providedIn: 'root' })
export class SearchService {
	private readonly supabase = inject(SupabaseService)
	private readonly apollo   = inject(Apollo)

	searchPosts(query: string): Observable<SearchPost[]> {
		const q = query.trim()
		return from(
			this.supabase.client
				.from('posts')
				.select('id, title, description, post_type, likes_count, comments_count, media:post_media(media_url, media_type, position)')
				.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
				.order('likes_count', { ascending: false })
				.limit(24),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return ((data ?? []) as unknown as PostRow[]).map(row => {
					const thumb = row.media?.sort((a, b) => a.position - b.position)[0] ?? null
					return {
						id: row.id,
						title: row.title,
						description: row.description,
						postType: row.post_type,
						likesCount: row.likes_count,
						commentsCount: row.comments_count,
						thumbnailUrl: thumb?.media_url ?? null,
						thumbnailType: thumb?.media_type ?? null,
					}
				})
			}),
		)
	}

	searchUsers(query: string): Observable<SearchUser[]> {
		const q = query.trim()
		return this.apollo.query<{ searchUsers: GqlSearchUser[] }>({
			query: SEARCH_USERS_QUERY,
			variables: { q, limit: 20, offset: 0 },
			fetchPolicy: 'network-only',
		}).pipe(
			map(res => (res.data?.searchUsers ?? []).map(u => ({
				userId: u.id,
				username: u.username ?? '',
				fullName: u.display_name,
				photoUrl: u.avatar_url,
				bio: null,
				followersCount: u.followers_count ?? 0,
				isFollowing: !!u.isFollowing,
			}))),
		)
	}
}
