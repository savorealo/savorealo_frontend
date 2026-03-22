// src/app/features/stories/models/story.model.ts

export type StoryType = 'PHOTO' | 'VIDEO'

export interface Story {
	id: string
	userId: string
	storyType: StoryType
	mediaUrl: string
	createdAt: Date
	expiresAt: Date
}

export interface ViewedStory {
	userId: string
	storyId: string
	viewedAt: Date
}
