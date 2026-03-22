// src/app/features/places/models/place.model.ts

export type PlaceType = 'RESTAURANT' | 'BAR' | 'CAFE' | 'BAKERY' | 'FOOD_TRUCK'
export type PlaceFilter =
	| 'BURGER' | 'SEAFOOD' | 'ITALIAN' | 'MEXICAN' | 'CHINESE'
	| 'JAPANESE' | 'COCKTAIL' | 'WINE' | 'HAPPY_HOUR' | 'NIGHTLIFE'

export interface Place {
	id: string
	name: string
	address: string
	description: string | null
	mediaUrl: string | null
	filters: PlaceFilter[]
	isOpen: boolean
	location: string
	phone: string | null
	specialty: string | null
	website: string | null
	averageRating: number
	reviewsCount: number
	placeType: PlaceType
}

export interface PlaceReview {
	id: string
	userId: string
	placeId: string
	rating: number
	comment: string | null
	photoUrl: string | null
	createdAt: Date
}
