export interface Comment {
	id: string
	postId: string
	authorId: string
	author: {
		username: string
		name: string | null
		photoUrl: string | null
	}
	text: string
	createdAt: Date
}

export interface SavedPost {
	userId: string
	postId: string
	savedAt: Date
}

export interface LikeResult {
	liked: boolean
	likesCount: number
}
