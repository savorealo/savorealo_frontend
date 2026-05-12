import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import { Comment } from '@core/models/post-actions/post-actions.model'

export interface CommentPage {
	comments: Comment[]
	endCursor: string | null
	hasNextPage: boolean
	totalCount: number
}

interface SbCommentRow {
	id: string
	post_id: string
	text: string
	created_at: string
	author: { id: string; person_profiles: { username: string; full_name: string | null; photo_url: string | null }[] } | null
}

const COMMENT_SELECT = `
	id, post_id, text, created_at,
	author:users!comments_user_id_fkey(id, person_profiles(username, full_name, photo_url))
`

@Injectable({ providedIn: 'root' })
export class CommentService {
	private readonly supabase = inject(SupabaseService)

	getPostComments(postId: string, limit = 40, _after?: string | null): Observable<CommentPage> {
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
				const comments = ((data ?? []) as unknown as SbCommentRow[]).map(row => this.mapRow(row))
				return { comments, endCursor: null, hasNextPage: false, totalCount: comments.length }
			}),
		)
	}

	addComment(postId: string, text: string): Observable<Comment> {
		return from(this.doAddComment(postId, text))
	}

	deleteComment(commentId: string): Observable<boolean> {
		return from(
			this.supabase.client.from('comments').delete().eq('id', commentId),
		).pipe(map(({ error }) => { if (error) throw new Error(error.message); return true }))
	}

	private async doAddComment(postId: string, text: string): Promise<Comment> {
		const { data: auth } = await this.supabase.client.auth.getUser()
		const userId = auth.user?.id
		if (!userId) throw new Error('No autenticado')

		const { data, error } = await this.supabase.client
			.from('comments')
			.insert({ post_id: postId, user_id: userId, text })
			.select(COMMENT_SELECT)
			.single()

		if (error) throw new Error(error.message)
		return this.mapRow(data as unknown as SbCommentRow)
	}

	private mapRow(row: SbCommentRow): Comment {
		const authorUser = Array.isArray(row.author) ? row.author[0] : row.author
		const profile    = authorUser?.person_profiles?.[0] ?? null
		return {
			id:       row.id,
			postId:   row.post_id,
			authorId: authorUser?.id ?? '',
			author: {
				username: profile?.username  ?? 'usuario',
				name:     profile?.full_name ?? null,
				photoUrl: profile?.photo_url ?? null,
			},
			text:      row.text,
			createdAt: new Date(row.created_at),
		}
	}
}
