// src/app/core/models/user.dto.ts
// Lo que devuelve Supabase/GraphQL al hacer join de las tres tablas

/**
 * Tipo de dato personalizado para usertype.
 */
export type UserType = 'PERSON' | 'RESTAURANT' | 'BAR'

/**
 * Objeto de transferencia de datos (DTO) para representar la estructura de el usuario o chef.
 */
export interface UserDto {
	// public.users
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar user type.
	 */
	user_type: UserType
	/**
	 * Propiedad para gestionar followers cantidad.
	 */
	followers_count: number
	/**
	 * Propiedad para gestionar following cantidad.
	 */
	following_count: number
	/**
	 * Propiedad para gestionar posts cantidad.
	 */
	posts_count: number
	/**
	 * Propiedad para gestionar created at.
	 */
	created_at: string
	/**
	 * Propiedad para gestionar updated at.
	 */
	updated_at: string

	// public.person_profiles (si user_type === 'PERSON')
	/**
	 * Propiedad para gestionar person profiles.
	 */
	person_profiles?: {
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
		/**
		 * Propiedad para gestionar biografía.
		 */
		bio: string | null
		/**
		 * Propiedad para gestionar ubicación.
		 */
		location: string | null
		/**
		 * Propiedad para gestionar birth fecha.
		 */
		birth_date: string | null
	}

	// public.business_profiles (si user_type === 'RESTAURANT' o 'BAR')
	/**
	 * Propiedad para gestionar business profiles.
	 */
	business_profiles?: {
		/**
		 * Propiedad para gestionar business nombre.
		 */
		business_name: string
		/**
		 * Propiedad para gestionar foto enlace.
		 */
		photo_url: string | null
		/**
		 * Propiedad para gestionar biografía.
		 */
		bio: string | null
		/**
		 * Propiedad para gestionar ubicación.
		 */
		location: string
		/**
		 * Propiedad para gestionar specialty.
		 */
		specialty: string | null
		/**
		 * Propiedad para gestionar phone.
		 */
		phone: string
		/**
		 * Propiedad para gestionar website.
		 */
		website: string | null
	}
}
