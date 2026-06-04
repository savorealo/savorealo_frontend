// src/app/features/places/models/place.model.ts

/**
 * Tipo de dato personalizado para placetype.
 */
export type PlaceType = 'RESTAURANT' | 'BAR' | 'CAFE' | 'BAKERY' | 'FOOD_TRUCK'
/**
 * Tipo de dato personalizado para placefilter.
 */
export type PlaceFilter =
	| 'BURGER' | 'SEAFOOD' | 'ITALIAN' | 'MEXICAN' | 'CHINESE'
	| 'JAPANESE' | 'COCKTAIL' | 'WINE' | 'HAPPY_HOUR' | 'NIGHTLIFE'

/**
 * Interfaz que define la estructura o contrato de datos para un lugar gastronómico.
 */
export interface Place {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar nombre.
	 */
	name: string
	/**
	 * Propiedad para gestionar address.
	 */
	address: string
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string | null
	/**
	 * Propiedad para gestionar media enlace.
	 */
	mediaUrl: string | null
	/**
	 * Propiedad para gestionar filters.
	 */
	filters: PlaceFilter[]
	/**
	 * Indicador booleano para es o está abrir.
	 */
	isOpen: boolean
	/**
	 * Propiedad para gestionar ubicación.
	 */
	location: string
	/**
	 * Propiedad para gestionar phone.
	 */
	phone: string | null
	/**
	 * Propiedad para gestionar specialty.
	 */
	specialty: string | null
	/**
	 * Propiedad para gestionar website.
	 */
	website: string | null
	/**
	 * Propiedad para gestionar average rating.
	 */
	averageRating: number
	/**
	 * Propiedad para gestionar reviews cantidad.
	 */
	reviewsCount: number
	/**
	 * Propiedad para gestionar place type.
	 */
	placeType: PlaceType
}

/**
 * Interfaz que define la estructura o contrato de datos para placereview.
 */
export interface PlaceReview {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId: string
	/**
	 * Propiedad para gestionar place identificador.
	 */
	placeId: string
	/**
	 * Propiedad para gestionar rating.
	 */
	rating: number
	/**
	 * Propiedad para gestionar comment.
	 */
	comment: string | null
	/**
	 * Propiedad para gestionar foto enlace.
	 */
	photoUrl: string | null
	/**
	 * Propiedad para gestionar created at.
	 */
	createdAt: Date
}
