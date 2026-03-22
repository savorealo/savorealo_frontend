// src/app/features/feed/models/allergen.model.ts

export interface Allergen {
	id: string
	name: string
}

export interface UserAllergy {
	userId: string
	allergenId: string
}

export interface Preference {
	id: string
	name: string
}

export interface UserPreference {
	userId: string
	preferenceId: string
}
