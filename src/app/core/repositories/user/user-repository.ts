import { Observable } from 'rxjs'

export interface GqlUser {
	id: string
	username: string | null
	display_name: string | null
	avatar_url: string | null
	bio: string | null
	location: string | null
	posts_count: number | null
	followers_count: number | null
	following_count: number | null
	isFollowing: boolean | null
	followStatus: string | null
	is_private: boolean | null
	isViewable: boolean | null
	isFollowingViewer: boolean | null
}

export interface GqlFollowUser {
	id: string
	username: string | null
	display_name: string | null
	avatar_url: string | null
	followStatus: string | null
}

export interface GqlSuggestedUser {
	id: string
	username: string | null
	display_name: string | null
	avatar_url: string | null
	isFollowing: boolean | null
}

export interface ToggleFollowResult {
	userId: string
	following: boolean
	requested: boolean
}

export interface RespondFollowRequestResult {
	requestId: string
	accepted: boolean
}

export interface IUserRepository {
	getUserById(id: string): Observable<GqlUser | null>
	findUserIdByUsername(username: string): Observable<string | null>
	checkUsername(username: string): Observable<{ valid: boolean; available: boolean; reason: string | null }>
	toggleFollow(targetUserId: string): Observable<ToggleFollowResult>
	respondFollowRequest(actorId: string, accept: boolean): Observable<RespondFollowRequestResult>
	getFollowers(userId: string, limit: number): Observable<GqlFollowUser[]>
	getFollowing(userId: string, limit: number): Observable<GqlFollowUser[]>
	getSuggestedUsers(preferenceIds: string[], limit?: number): Observable<GqlSuggestedUser[]>
}
