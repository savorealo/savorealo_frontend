import { Observable } from 'rxjs'

export interface SearchPostRow {
	id: string
	title: string | null
	description: string | null
	post_type: string
	likes_count: number
	comments_count: number
	media: { media_url: string; media_type: string; position: number }[]
}

export interface GqlSearchUser {
	id: string
	username: string | null
	display_name: string | null
	avatar_url: string | null
	followers_count: number | null
	isFollowing: boolean | null
}

export interface ISearchRepository {
	searchPosts(query: string, limit: number): Observable<SearchPostRow[]>
	searchUsers(query: string, limit: number, offset: number): Observable<GqlSearchUser[]>
}
