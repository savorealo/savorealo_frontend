// src/app/features/feed/models/post-actions.dto.ts

/**
 * Objeto de transferencia de datos (DTO) para representar la estructura de un comentario.
 */
export interface CommentDto {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar user identificador.
	 */
	user_id: string
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
		 * Propiedad para gestionar nombre de usuario.
		 */
		username: string
		/**
		 * Propiedad para gestionar full nombre.
		 */
		full_name: string | null
		/**
		 * Propiedad para gestionar foto enlace.
		 */
		photo_url: string | null
	}
}

/**
 * Objeto de transferencia de datos (DTO) para representar la estructura de savedpost.
 */
export interface SavedPostDto {
	/**
	 * Propiedad para gestionar user identificador.
	 */
	user_id: string
	/**
	 * Propiedad para gestionar post identificador.
	 */
	post_id: string
	/**
	 * Propiedad para gestionar saved at.
	 */
	saved_at: string
}

/**
 * Objeto de transferencia de datos (DTO) para representar la estructura de likeresult.
 */
export interface LikeResultDto {
	/**
	 * Propiedad para gestionar liked.
	 */
	liked: boolean
	/**
	 * Propiedad para gestionar likes cantidad.
	 */
	likes_count: number
}
