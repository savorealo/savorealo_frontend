import { inject, Injectable } from '@angular/core'
import { from, map, Observable, switchMap } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import { Comment } from '@core/models/post-actions/post-actions.model'
import { COMMENT_REPOSITORY } from '@core/repositories/tokens/repository.tokens'
import type { SbCommentRow } from '@core/repositories/comment/comment-repository'

/**
 * Componente principal para la vista o página de un comentario.
 */
export interface CommentPage {
	/**
	 * Propiedad para gestionar comments.
	 */
	comments: Comment[]
	/**
	 * Propiedad para gestionar end cursor.
	 */
	endCursor: string | null
	/**
	 * Indicador booleano para tiene next page.
	 */
	hasNextPage: boolean
	/**
	 * Propiedad para gestionar total cantidad.
	 */
	totalCount: number
}

/**
 * Servicio que provee la lógica de negocio para un comentario.
 */
@Injectable({ providedIn: 'root' })
export class CommentService {
	/**
	 * Propiedad para gestionar repo.
	 */
	private readonly repo = inject(COMMENT_REPOSITORY)
	/**
	 * Propiedad para gestionar supabase.
	 */
	private readonly supabase = inject(SupabaseService)

	/**
	 * Método para obtener post comments.
	 */
	getPostComments(postId: string, limit = 40, _after?: string | null): Observable<CommentPage> {
		return this.repo.getPostComments(postId, limit).pipe(
			map(rows => {
				const comments = rows.map(row => this.mapRow(row))
				return { comments, endCursor: null, hasNextPage: false, totalCount: comments.length }
			}),
		)
	}

	/**
	 * Método para añadir comment.
	 */
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

	/**
	 * Método para eliminar comment.
	 */
	deleteComment(commentId: string): Observable<boolean> {
		return this.repo.deleteComment(commentId).pipe(map(() => true))
	}

	/**
	 * Método para map row.
	 */
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
