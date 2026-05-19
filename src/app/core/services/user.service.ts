import { inject, Injectable } from '@angular/core'
import { map, Observable, of, switchMap } from 'rxjs'
import { User } from '@core/models/user/User'
import { Post } from '@core/models/post/post.model'
import { FeedService } from '@core/services/feed.service'
import { POST_REPOSITORY, USER_REPOSITORY } from '@core/repositories/tokens/repository.tokens'
import type { GqlUser } from '@core/repositories/user/user-repository'

export interface SuggestedUser {
	id: string
	username: string | null
	displayName: string | null
	avatarUrl: string | null
	isFollowing: boolean
}

export interface PublicUser extends User {
	isFollowedByCurrentUser: boolean
	followStatus: 'none' | 'following' | 'requested'
	isPrivate: boolean
	isViewable: boolean
	followsYou: boolean
}

export interface FollowListUser {
	id: string
	username: string | null
	displayName: string | null
	avatarUrl: string | null
	followStatus: 'none' | 'following' | 'requested'
}

export interface UserPostsPage {
	posts: Post[]
	endCursor: string | null
	hasNextPage: boolean
	totalCount: number
}

@Injectable({ providedIn: 'root' })
export class UserService {
	private readonly userRepo = inject(USER_REPOSITORY)
	private readonly postRepo = inject(POST_REPOSITORY)
	private readonly feedSvc  = inject(FeedService)

	getUserByUsername(username: string): Observable<PublicUser | null> {
		return this.userRepo.findUserIdByUsername(username).pipe(
			switchMap(userId => {
				if (!userId) return of(null)
				return this.userRepo.getUserById(userId).pipe(
					map(u => {
						if (!u) return null
						return this.mapPublicUser(u)
					}),
				)
			}),
		)
	}

	getUserById(userId: string): Observable<{ data: User }> {
		return this.userRepo.getUserById(userId).pipe(
			map(u => {
				if (!u) throw new Error('Usuario no encontrado')
				return { data: this.mapUser(u) }
			}),
		)
	}

	getUserPosts(userId: string, limit = 12, offset = 0): Observable<UserPostsPage> {
		return this.postRepo.fetchUserPosts(userId, limit, offset).pipe(
			map(nodes => {
				const posts = nodes.map(n => this.feedSvc.mapGqlPost(n))
				return { posts, endCursor: null, hasNextPage: false, totalCount: posts.length }
			}),
		)
	}

	checkUsername(username: string): Observable<{ valid: boolean; available: boolean; reason: string | null }> {
		return this.userRepo.checkUsername(username)
	}

	toggleFollow(targetUserId: string, _currentlyFollowing: boolean): Observable<{ following: boolean; requested: boolean }> {
		return this.userRepo.toggleFollow(targetUserId).pipe(
			map(res => ({ following: res.following, requested: res.requested })),
		)
	}

	respondFollowRequest(actorId: string, accept: boolean): Observable<{ requestId: string; accepted: boolean }> {
		return this.userRepo.respondFollowRequest(actorId, accept)
	}

	getFollowers(userId: string, limit = 20): Observable<FollowListUser[]> {
		return this.userRepo.getFollowers(userId, limit).pipe(
			map(users => users.map(u => ({
				id: u.id,
				username: u.username,
				displayName: u.display_name,
				avatarUrl: u.avatar_url,
				followStatus: (u.followStatus === 'following' || u.followStatus === 'requested' ? u.followStatus : 'none') as FollowListUser['followStatus'],
			}))),
		)
	}

	getSuggestedUsers(preferenceIds: string[] = [], limit = 5): Observable<SuggestedUser[]> {
		return this.userRepo.getSuggestedUsers(preferenceIds, limit).pipe(
			map(users => users.map(u => ({
				id: u.id,
				username: u.username,
				displayName: u.display_name,
				avatarUrl: u.avatar_url,
				isFollowing: !!u.isFollowing,
			}))),
		)
	}

	getFollowing(userId: string, limit = 20): Observable<FollowListUser[]> {
		return this.userRepo.getFollowing(userId, limit).pipe(
			map(users => users.map(u => ({
				id: u.id,
				username: u.username,
				displayName: u.display_name,
				avatarUrl: u.avatar_url,
				followStatus: (u.followStatus === 'following' || u.followStatus === 'requested' ? u.followStatus : 'none') as FollowListUser['followStatus'],
			}))),
		)
	}

	private mapPublicUser(u: GqlUser): PublicUser {
		const rawStatus = u.followStatus ?? (u.isFollowing ? 'following' : 'none')
		const followStatus: 'none' | 'following' | 'requested' =
			rawStatus === 'following' || rawStatus === 'requested' ? rawStatus as 'following' | 'requested' : 'none'
		return {
			id:             u.id,
			email:          '',
			username:       u.username ?? '',
			fullName:       u.display_name ?? null,
			photo_url:      u.avatar_url ?? null,
			bio:            u.bio ?? null,
			location:       u.location ?? null,
			birth_date:     null,
			postsCount:     u.posts_count ?? null,
			followersCount: u.followers_count ?? null,
			followingCount: u.following_count ?? null,
			isFollowedByCurrentUser: !!u.isFollowing,
			followStatus,
			isPrivate: !!u.is_private,
			isViewable: u.isViewable ?? true,
			followsYou: !!u.isFollowingViewer,
		}
	}

	private mapUser(u: GqlUser): User {
		return {
			id:             u.id,
			email:          '',
			username:       u.username ?? '',
			fullName:       u.display_name ?? null,
			photo_url:      u.avatar_url ?? null,
			bio:            u.bio ?? null,
			location:       u.location ?? null,
			birth_date:     null,
			postsCount:     u.posts_count ?? null,
			followersCount: u.followers_count ?? null,
			followingCount: u.following_count ?? null,
		}
	}
}
