import { Observable } from 'rxjs'

export interface SbCommentRow {
	id: string
	post_id: string
	text: string
	created_at: string
	author: { 
		id: string;
		 	person_profiles: {
			 	username: string;
				full_name: string | null;
				 photo_url: string | null 
			}[] 
	} | null
}

export interface ICommentRepository {
	getPostComments(postId: string, limit: number): Observable<SbCommentRow[]>
	addComment(postId: string, userId: string, text: string): Observable<SbCommentRow>
	deleteComment(commentId: string): Observable<void>
}
