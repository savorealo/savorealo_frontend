// src/app/features/feed/models/post-actions.model.ts

export interface Comment {
	id: string
	postId: string
	authorId: string
	author: {
		username: string
		name: string | null
		photoUrl: string | null
	}
	text: string        // mismo nombre que en BD — ya es semántico
	createdAt: Date
}

export interface Like {
	userId: string
	postId: string
	createdAt: Date
}

export interface SavedPost {
	userId: string
	postId: string
	savedAt: Date
}

export interface ViewedPost {
	userId: string
	postId: string
	viewedAt: Date
}

export interface Follow {
	followerId: string
	followedId: string
	followedAt: Date
}
