// src/app/features/feed/models/allergen.model.ts

/**
 * Interfaz que define la estructura o contrato de datos para allergen.
 */
export interface Allergen {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar nombre.
	 */
	name: string
}

/**
 * Interfaz que define la estructura o contrato de datos para userallergy.
 */
export interface UserAllergy {
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId: string
	/**
	 * Propiedad para gestionar allergen identificador.
	 */
	allergenId: string
}

/**
 * Interfaz que define la estructura o contrato de datos para preference.
 */
export interface Preference {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar nombre.
	 */
	name: string
}

/**
 * Interfaz que define la estructura o contrato de datos para userpreference.
 */
export interface UserPreference {
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId: string
	/**
	 * Propiedad para gestionar preference identificador.
	 */
	preferenceId: string
}
