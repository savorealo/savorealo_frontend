export type StoryType = 'PHOTO' | 'VIDEO'

export interface StoryItem {
	id: string
	userId: string
	storyType: StoryType
	mediaUrl: string
	createdAt: string
	expiresAt: string
	viewed: boolean
}

export interface StoryGroup {
	userId: string
	username: string
	displayName: string
	avatarUrl: string | null
	stories: StoryItem[]
	hasUnviewed: boolean
}
