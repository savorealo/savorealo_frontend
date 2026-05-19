import { Observable } from 'rxjs'
import { StoryType } from '@core/models/story/story.model'

export interface StoryRow {
	id: string
	user_id: string
	story_type: StoryType
	media_url: string
	created_at: string
	expires_at: string
	viewed: { user_id: string }[]
}

export interface StoryUserRow {
	id: string
	user_type: string
	person_profiles: { username: string; full_name: string | null; photo_url: string | null } | { username: string; full_name: string | null; photo_url: string | null }[] | null
	business_profiles: { business_name: string; photo_url: string | null } | { business_name: string; photo_url: string | null }[] | null
}

export interface IStoryRepository {
	getFollowedUserIds(currentUserId: string): Observable<string[]>
	getActiveStories(userIds: string[], now: string): Observable<StoryRow[]>
	getUserProfiles(userIds: string[]): Observable<StoryUserRow[]>
	markViewed(storyId: string, userId: string): Observable<void>
	uploadStoryMedia(path: string, file: File): Observable<string>
	insertStory(userId: string, storyType: StoryType, mediaUrl: string, expiresAt: string): Observable<void>
}
