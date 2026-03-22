// src/app/core/models/user.dto.ts
// Lo que devuelve Supabase/GraphQL al hacer join de las tres tablas

export type UserType = 'PERSON' | 'RESTAURANT' | 'BAR'

export interface UserDto {
	// public.users
	id: string
	user_type: UserType
	followers_count: number
	following_count: number
	posts_count: number
	created_at: string
	updated_at: string

	// public.person_profiles (si user_type === 'PERSON')
	person_profiles?: {
		username: string
		full_name: string | null
		photo_url: string | null
		bio: string | null
		location: string | null
		birth_date: string | null
	}

	// public.business_profiles (si user_type === 'RESTAURANT' o 'BAR')
	business_profiles?: {
		business_name: string
		photo_url: string | null
		bio: string | null
		location: string
		specialty: string | null
		phone: string
		website: string | null
	}
}
