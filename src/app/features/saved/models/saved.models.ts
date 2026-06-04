/**
 * Tipo de filtro de visualización en la biblioteca de guardados ('all' | 'recipes' | 'posts' | 'collections').
 */
export type SavedFilter = 'all' | 'recipes' | 'posts' | 'collections'

/**
 * Representa la estructura de datos de una receta guardada dentro de la biblioteca del usuario.
 */
export interface SavedRecipe {
	/**
	 * Identificador único de la publicación guardada.
	 */
	id: string

	/**
	 * Tipo de publicación ('recipe' o 'post').
	 */
	type: 'recipe' | 'post'

	/**
	 * Título de la receta o post.
	 */
	title: string

	/**
	 * Descripción resumida de la publicación.
	 */
	description: string

	/**
	 * Nombre o identificador del autor/chef que la publicó.
	 */
	author: string

	/**
	 * URL de la imagen del avatar del autor.
	 */
	authorAvatarUrl: string

	/**
	 * URL del recurso de imagen principal de la publicación.
	 */
	imageUrl: string

	/**
	 * Categoría o etiqueta principal de la receta.
	 */
	category: string

	/**
	 * Tiempo estimado requerido para la preparación.
	 */
	time: string

	/**
	 * Número de porciones o raciones sugeridas.
	 */
	servings: number

	/**
	 * Fecha y hora en que se guardó.
	 */
	savedAt: string

	/**
	 * Conteo consolidado de reacciones 'Me gusta'.
	 */
	likes: number

	/**
	 * Conteo consolidado de comentarios.
	 */
	comments: number
}

/**
 * Representa una colección personalizada de elementos guardados creada por el usuario.
 */
export interface SavedCollection {
	/**
	 * Identificador único de la colección.
	 */
	id: string

	/**
	 * Título o nombre de la colección personalizada (ej. 'Favoritos de fin de semana').
	 */
	title: string

	/**
	 * Descripción acerca de la colección.
	 */
	description: string

	/**
	 * Cantidad total de elementos incluidos dentro de la colección.
	 */
	count: number

	/**
	 * Colección de URLs de imágenes miniatura representativas para el collage de portada.
	 */
	imageUrls: string[]

	/**
	 * Color de acento de diseño para la colección en formato hexadecimal o clase.
	 */
	accent: string
}
