import { Observable } from 'rxjs'

/**
 * Interfaz que define la estructura o contrato de datos para sbcommentrow.
 */
export interface SbCommentRow {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar post identificador.
	 */
	post_id: string
	/**
	 * Propiedad para gestionar text.
	 */
	text: string
	/**
	 * Propiedad para gestionar created at.
	 */
	created_at: string
	/**
	 * Propiedad para gestionar author.
	 */
	author: { 
		/**
		 * Propiedad para gestionar identificador.
		 */
		id: string;
		 	/**
		 	 * Propiedad para gestionar person profiles.
		 	 */
		 	person_profiles: {
			 	/**
			 	 * Propiedad para gestionar nombre de usuario.
			 	 */
			 	username: string;
				/**
				 * Propiedad para gestionar full nombre.
				 */
				full_name: string | null;
				 /**
				  * Propiedad para gestionar foto enlace.
				  */
				 photo_url: string | null 
			}[] 
	} | null
}

/**
 * Repositorio de datos para icomment.
 */
export interface ICommentRepository {
	/**
	 * Método para obtener post comments.
	 */
	getPostComments(postId: string, limit: number): Observable<SbCommentRow[]>
	/**
	 * Método para añadir comment.
	 */
	addComment(postId: string, userId: string, text: string): Observable<SbCommentRow>
	/**
	 * Método para eliminar comment.
	 */
	deleteComment(commentId: string): Observable<void>
}
