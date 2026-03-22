// src/app/features/feed/models/post-actions.dto.ts

export interface LikeDto {
	user_id: string
	post_id: string
	created_at: string
}

export interface CommentDto {
	id: string
	user_id: string
	post_id: string
	text: string       // en vuestra BD el campo se llama "text", no "content"
	created_at: string
	// join con person_profiles
	author?: {
		username: string
		full_name: string | null
		photo_url: string | null
	}
}

export interface SavedPostDto {
	user_id: string
	post_id: string
	saved_at: string
}
