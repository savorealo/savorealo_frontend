/**
 * Interfaz que define la estructura o contrato de datos para un comentario.
 */
export interface Comment {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar post identificador.
	 */
	postId: string
	/**
	 * Propiedad para gestionar author identificador.
	 */
	authorId: string
	/**
	 * Propiedad para gestionar author.
	 */
	author: {
		/**
		 * Propiedad para gestionar nombre de usuario.
		 */
		username: string
		/**
		 * Propiedad para gestionar nombre.
		 */
		name: string | null
		/**
		 * Propiedad para gestionar foto enlace.
		 */
		photoUrl: string | null
	}
	/**
	 * Propiedad para gestionar text.
	 */
	text: string
	/**
	 * Propiedad para gestionar created at.
	 */
	createdAt: Date
}

/**
 * Interfaz que define la estructura o contrato de datos para savedpost.
 */
export interface SavedPost {
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId: string
	/**
	 * Propiedad para gestionar post identificador.
	 */
	postId: string
	/**
	 * Propiedad para gestionar saved at.
	 */
	savedAt: Date
}

/**
 * Interfaz que define la estructura o contrato de datos para likeresult.
 */
export interface LikeResult {
	/**
	 * Propiedad para gestionar liked.
	 */
	liked: boolean
	/**
	 * Propiedad para gestionar likes cantidad.
	 */
	likesCount: number
}
