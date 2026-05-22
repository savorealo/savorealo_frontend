import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import type { ICommentRepository, SbCommentRow } from './comment-repository'

const COMMENT_SELECT = `
	id, post_id, text, created_at,
	author:users!comments_user_id_fkey(id, person_profiles(username, full_name, photo_url))
`

@Injectable({ providedIn: 'root' })
export class CommentSupabaseRepository implements ICommentRepository {
	private readonly supabase = inject(SupabaseService)

	getPostComments(postId: string, limit: number): Observable<SbCommentRow[]> {
		return from(
			this.supabase.client
				.from('comments')
				.select(COMMENT_SELECT)
				.eq('post_id', postId)
				.order('created_at', { ascending: false })
				.limit(limit),
		).pipe(
			map(({ data, error }) => {
				if (error) throw new Error(error.message)
				return (data ?? []) as unknown as SbCommentRow[]
			}),
		)
	}

	addComment(postId: string, userId: string, text: string): Observable<SbCommentRow> {
		return from(
			this.supabase.client
				.from('comments')
				.insert({ post_id: postId, user_id: userId, text })
				.select(COMMENT_SELECT)
				.single(),
		).pipe(
			map(({ data, error }) => {
				if (error) throw new Error(error.message)
				return data as unknown as SbCommentRow
			}),
		)
	}

	deleteComment(commentId: string): Observable<void> {
		return from(
			this.supabase.client.from('comments').delete().eq('id', commentId),
		).pipe(
			map(({ error }) => { if (error) throw new Error(error.message) }),
		)
	}
}
