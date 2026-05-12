import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'

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

interface UserRow {
	user_id: string
	username: string
	full_name: string | null
	photo_url: string | null
	bio: string | null
}

@Injectable({ providedIn: 'root' })
export class SearchService {
	private readonly supabase = inject(SupabaseService)

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
		return from(
			this.supabase.client
				.from('person_profiles')
				.select('user_id, username, full_name, photo_url, bio')
				.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
				.limit(20),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return ((data ?? []) as unknown as UserRow[]).map(row => ({
					userId: row.user_id,
					username: row.username,
					fullName: row.full_name,
					photoUrl: row.photo_url,
					bio: row.bio,
				}))
			}),
		)
	}
}
