// src/app/features/feed/models/post-actions.dto.ts

export interface CommentDto {
	id: string
	user_id: string
	post_id: string
	text: string
	created_at: string
	author: {
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

export interface LikeResultDto {
	liked: boolean
	likes_count: number
}
