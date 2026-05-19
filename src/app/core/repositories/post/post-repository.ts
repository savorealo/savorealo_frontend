import { Observable } from 'rxjs'

export interface GqlPostNode {
	id: string
	post_type: string
	title: string | null
	description: string | null
	created_at: string
	likes_count: number
	comments_count: number
	saves_count: number
	liked?: boolean
	saved?: boolean
	categories?: string[] | null
	author: { id: string; username: string | null; display_name: string | null; avatar_url: string | null } | null
	post_media: { id: string; media_url: string; media_type: string; position: number }[] | null
	recipe: { id: string; name: string; description: string | null; steps: string | null; time_required: number | null; estimated_cost: number | null; servings: number | null; difficulty: string | null } | null
}

export interface SavedPostsResult {
	posts: GqlPostNode[]
	nextCursor: string | null
	hasNextPage: boolean
}

export interface ToggleLikeResult {
	postId: string
	liked: boolean
	likes: number
}

export interface ToggleSaveResult {
	postId: string
	saved: boolean
	saves: number
}

export interface IPostRepository {
	fetchHomeFeed(limit: number, offset: number): Observable<GqlPostNode[]>
	fetchDiscoverFeed(limit: number, offset: number, category: string | null): Observable<GqlPostNode[]>
	fetchSavedPosts(limit: number, cursor: string | null): Observable<SavedPostsResult>
	fetchLikedPosts(limit: number, offset: number): Observable<GqlPostNode[]>
	fetchUserPosts(userId: string, limit: number, offset: number): Observable<GqlPostNode[]>
	readPostFromCache(id: string): GqlPostNode | null
	toggleLike(postId: string): Observable<ToggleLikeResult>
	toggleSave(postId: string): Observable<ToggleSaveResult>
	createPost(input: { userId: string; description: string; title: string | null; postType: string }): Observable<string>
	insertPostMedia(postId: string, mediaUrl: string, mediaType: string): Observable<void>
}
