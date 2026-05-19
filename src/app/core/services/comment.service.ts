import { inject, Injectable } from '@angular/core'
import { from, map, Observable, switchMap } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import { Comment } from '@core/models/post-actions/post-actions.model'
import { COMMENT_REPOSITORY } from '@core/repositories/tokens/repository.tokens'
import type { SbCommentRow } from '@core/repositories/comment/comment-repository'

export interface CommentPage {
	comments: Comment[]
	endCursor: string | null
	hasNextPage: boolean
	totalCount: number
}

@Injectable({ providedIn: 'root' })
export class CommentService {
	private readonly repo = inject(COMMENT_REPOSITORY)
	private readonly supabase = inject(SupabaseService)

	getPostComments(postId: string, limit = 40, _after?: string | null): Observable<CommentPage> {
		return this.repo.getPostComments(postId, limit).pipe(
			map(rows => {
				const comments = rows.map(row => this.mapRow(row))
				return { comments, endCursor: null, hasNextPage: false, totalCount: comments.length }
			}),
		)
	}

	addComment(postId: string, text: string): Observable<Comment> {
		return from(this.supabase.client.auth.getUser()).pipe(
			switchMap(({ data }) => {
				const userId = data.user?.id
				if (!userId) throw new Error('No autenticado')
				return this.repo.addComment(postId, userId, text)
			}),
			map(row => this.mapRow(row)),
		)
	}

	deleteComment(commentId: string): Observable<boolean> {
		return this.repo.deleteComment(commentId).pipe(map(() => true))
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
