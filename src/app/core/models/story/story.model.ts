/**
 * Tipo de dato personalizado para storytype.
 */
export type StoryType = 'PHOTO' | 'VIDEO'

/**
 * Interfaz que define la estructura o contrato de datos para storyitem.
 */
export interface StoryItem {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId: string
	/**
	 * Propiedad para gestionar story type.
	 */
	storyType: StoryType
	/**
	 * Propiedad para gestionar media enlace.
	 */
	mediaUrl: string
	/**
	 * Propiedad para gestionar created at.
	 */
	createdAt: string
	/**
	 * Propiedad para gestionar expires at.
	 */
	expiresAt: string
	/**
	 * Propiedad para gestionar viewed.
	 */
	viewed: boolean
}

/**
 * Interfaz que define la estructura o contrato de datos para storygroup.
 */
export interface StoryGroup {
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId: string
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string
	/**
	 * Propiedad para gestionar display nombre.
	 */
	displayName: string
	/**
	 * Propiedad para gestionar avatar enlace.
	 */
	avatarUrl: string | null
	/**
	 * Propiedad para gestionar stories.
	 */
	stories: StoryItem[]
	/**
	 * Indicador booleano para tiene unviewed.
	 */
	hasUnviewed: boolean
}
