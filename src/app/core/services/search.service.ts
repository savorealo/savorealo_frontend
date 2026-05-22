import { inject, Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'
import { SEARCH_REPOSITORY } from '@core/repositories/tokens/repository.tokens'

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

@Injectable({ providedIn: 'root' })
export class SearchService {
	private readonly repo = inject(SEARCH_REPOSITORY)

	searchPosts(query: string): Observable<SearchPost[]> {
		const q = query.trim()
		return this.repo.searchPosts(q, 24).pipe(
			map(rows => rows.map(row => {
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
			})),
		)
	}

	searchUsers(query: string): Observable<SearchUser[]> {
		const q = query.trim()
		return this.repo.searchUsers(q, 20, 0).pipe(
			map(users => users.map(u => ({
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
