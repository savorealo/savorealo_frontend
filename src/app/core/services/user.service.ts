import { inject, Injectable } from '@angular/core'
import { Apollo } from 'apollo-angular'
import { firstValueFrom, from, map, Observable, switchMap } from 'rxjs'
import { User } from '@core/models/user/User'
import { Post } from '@core/models/post/post.model'
import { SupabaseService } from '@core/services/supabase.service'
import { FeedService } from '@core/services/feed.service'
import { CHECK_USERNAME_QUERY, FOLLOWERS_QUERY, FOLLOWING_QUERY, GET_USER_QUERY, RESPOND_FOLLOW_REQUEST_MUTATION, TOGGLE_FOLLOW_MUTATION, USER_POSTS_QUERY } from '@graphql/feed.mutations'
import type { GqlPostNode } from '@core/services/feed.service'

export interface PublicUser extends User {
	isFollowedByCurrentUser: boolean
	followStatus: 'none' | 'following' | 'requested'
	isPrivate: boolean
	isViewable: boolean
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

interface GqlUser {
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
}

@Injectable({ providedIn: 'root' })
export class UserService {
	private readonly supabase = inject(SupabaseService)
	private readonly apollo   = inject(Apollo)
	private readonly feedSvc  = inject(FeedService)

	getUserByUsername(username: string): Observable<PublicUser | null> {
		return from(this.fetchUserByUsername(username))
	}

	getUserById(userId: string): Observable<{ data: User }> {
		return from(this.fetchUserById(userId)).pipe(map(data => ({ data })))
	}

	getUserPosts(userId: string, limit = 12, offset = 0): Observable<UserPostsPage> {
		return from(
			this.apollo.query<{ userPosts: GqlPostNode[] }>({
				query: USER_POSTS_QUERY,
				variables: { userId, limit, offset },
				fetchPolicy: 'network-only',
			}).toPromise(),
		).pipe(
			map(res => {
				const posts = (res?.data?.userPosts ?? []).map(n => this.feedSvc.mapGqlPost(n))
				// TODO: implement cursor-based pagination when backend exposes endCursor/hasNextPage
				return { posts, endCursor: null, hasNextPage: false, totalCount: posts.length }
			}),
		)
	}

	/** Comprueba en backend si un username es válido y está libre. */
	checkUsername(username: string): Observable<{ valid: boolean; available: boolean; reason: string | null }> {
		return this.apollo.query<{ checkUsername: { valid: boolean; available: boolean; reason: string | null } }>({
			query: CHECK_USERNAME_QUERY,
			variables: { username },
			fetchPolicy: 'network-only',
		}).pipe(
			map(res => res.data?.checkUsername ?? { valid: false, available: false, reason: 'No se pudo validar' }),
		)
	}

	/** Insert or delete a row in `follows`. Returns the new follow state. */
	toggleFollow(targetUserId: string, _currentlyFollowing: boolean): Observable<{ following: boolean; requested: boolean }> {
		return from(
			this.apollo.mutate<{ toggleFollow: { userId: string; following: boolean; requested: boolean } }>({
				mutation: TOGGLE_FOLLOW_MUTATION,
				variables: { userId: targetUserId },
				update: (cache, { data }) => {
					const result = data?.toggleFollow
					if (!result) return
					const nowFollowing = result.following
					const nowRequested = result.requested ?? false
					const newStatus = nowFollowing ? 'following' : nowRequested ? 'requested' : 'none'
					cache.modify({
						id: cache.identify({ __typename: 'users', id: targetUserId }),
						fields: {
							isFollowing: () => nowFollowing,
							followStatus: () => newStatus,
							followers_count: (prev: number) => (prev ?? 0) + (nowFollowing ? 1 : -1),
						},
					})
				},
			}).toPromise(),
		).pipe(map(res => ({
			following: res?.data?.toggleFollow?.following ?? false,
			requested: res?.data?.toggleFollow?.requested ?? false,
		})))
	}

	respondFollowRequest(actorId: string, accept: boolean): Observable<{ requestId: string; accepted: boolean }> {
		return from(
			this.supabase.client
				.from('follow_requests')
				.select('id')
				.eq('requester_id', actorId)
				.eq('status', 'PENDING')
				.maybeSingle(),
		).pipe(
			switchMap(({ data, error }) => {
				if (error || !data) throw new Error('Solicitud de seguimiento no encontrada')
				const requestId = (data as { id: string }).id
				return from(
					this.apollo.mutate<{ respondFollowRequest: { requestId: string; accepted: boolean } }>({
						mutation: RESPOND_FOLLOW_REQUEST_MUTATION,
						variables: { requestId, accept },
					}).toPromise(),
				).pipe(map(res => ({
					requestId: res?.data?.respondFollowRequest?.requestId ?? requestId,
					accepted: res?.data?.respondFollowRequest?.accepted ?? accept,
				})))
			}),
		)
	}

	getFollowers(userId: string, limit = 20): Observable<FollowListUser[]> {
		return from(this.fetchFollowList(FOLLOWERS_QUERY, 'followers', userId, limit))
	}

	getFollowing(userId: string, limit = 20): Observable<FollowListUser[]> {
		return from(this.fetchFollowList(FOLLOWING_QUERY, 'following', userId, limit))
	}

	private async fetchFollowList(query: any, key: string, userId: string, limit: number): Promise<FollowListUser[]> {
		const res = await firstValueFrom(
			this.apollo.query<Record<string, { id: string; username: string | null; display_name: string | null; avatar_url: string | null; followStatus: string | null }[]>>({
				query,
				variables: { userId, limit },
				fetchPolicy: 'network-only',
			}),
		)
		return (res.data?.[key] ?? []).map(u => ({
			id: u.id,
			username: u.username,
			displayName: u.display_name,
			avatarUrl: u.avatar_url,
			followStatus: (u.followStatus === 'following' || u.followStatus === 'requested' ? u.followStatus : 'none') as FollowListUser['followStatus'],
		}))
	}

	private async fetchUserById(userId: string): Promise<User> {
		const res = await firstValueFrom(
			this.apollo.query<{ user: GqlUser | null }>({
				query: GET_USER_QUERY,
				variables: { id: userId },
				fetchPolicy: 'network-only',
			}),
		)
		const u = res?.data?.user
		if (!u) throw new Error('Usuario no encontrado')
		return this.mapUser(u, false)
	}

	private async fetchUserByUsername(username: string): Promise<PublicUser | null> {
		// El backend GraphQL aún no expone búsqueda por username, así que
		// resolvemos `username → user_id` por Supabase REST y luego pedimos
		// los datos completos a `user(id)` GraphQL.
		const { data, error } = await this.supabase.client
			.from('person_profiles')
			.select('user_id')
			.eq('username', username)
			.maybeSingle()

		if (error || !data) return null
		const userId = (data as { user_id: string }).user_id

		const res = await firstValueFrom(
			this.apollo.query<{ user: GqlUser | null }>({
				query: GET_USER_QUERY,
				variables: { id: userId },
				fetchPolicy: 'network-only',
			}),
		)
		const u = res?.data?.user
		if (!u) return null

		const base = this.mapUser(u, true)
		const rawStatus = u.followStatus ?? (u.isFollowing ? 'following' : 'none')
		return {
			...base,
			isFollowedByCurrentUser: !!u.isFollowing,
			followStatus: (rawStatus === 'following' || rawStatus === 'requested') ? rawStatus as 'following' | 'requested' : 'none',
			isPrivate: !!u.is_private,
			isViewable: u.isViewable ?? true,
		}
	}

	private mapUser(u: GqlUser, _includeViewerState: boolean): PublicUser {
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
		}
	}
}
