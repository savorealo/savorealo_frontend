import { inject, Injectable } from '@angular/core'
import { Apollo } from 'apollo-angular'
import { firstValueFrom, from, map, Observable } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import {
	CHECK_USERNAME_QUERY, FOLLOWERS_QUERY, FOLLOWING_QUERY,
	GET_USER_QUERY, RESPOND_FOLLOW_REQUEST_MUTATION, SUGGESTED_USERS_QUERY, TOGGLE_FOLLOW_MUTATION,
} from '@graphql/feed.mutations'
import type { GqlFollowUser, GqlSuggestedUser, GqlUser, IUserRepository, RespondFollowRequestResult, ToggleFollowResult } from './user-repository'

@Injectable({ providedIn: 'root' })
export class UserGraphqlRepository implements IUserRepository {
	private readonly apollo = inject(Apollo)
	private readonly supabase = inject(SupabaseService)

	getUserById(id: string): Observable<GqlUser | null> {
		return from(firstValueFrom(
			this.apollo.query<{ user: GqlUser | null }>({
				query: GET_USER_QUERY,
				variables: { id },
				fetchPolicy: 'network-only',
			}),
		)).pipe(map(res => res?.data?.user ?? null))
	}

	findUserIdByUsername(username: string): Observable<string | null> {
		return from(
			this.supabase.client
				.from('person_profiles')
				.select('user_id')
				.eq('username', username)
				.maybeSingle(),
		).pipe(map(({ data, error }) => {
			if (error) return null
			return (data as { user_id: string } | null)?.user_id ?? null
		}))
	}

	checkUsername(username: string): Observable<{ valid: boolean; available: boolean; reason: string | null }> {
		return this.apollo.query<{ checkUsername: { valid: boolean; available: boolean; reason: string | null } }>({
			query: CHECK_USERNAME_QUERY,
			variables: { username },
			fetchPolicy: 'network-only',
		}).pipe(
			map(res => res.data?.checkUsername ?? { valid: false, available: false, reason: 'No se pudo validar' }),
		)
	}

	toggleFollow(targetUserId: string): Observable<ToggleFollowResult> {
		return from(firstValueFrom(
			this.apollo.mutate<{ toggleFollow: ToggleFollowResult }>({
				mutation: TOGGLE_FOLLOW_MUTATION,
				variables: { userId: targetUserId },
				update: (cache, { data }) => {
					const result = data?.toggleFollow
					if (!result) return
					const nowFollowing = result.following
					const nowRequested = result.requested ?? false
					const newStatus = nowFollowing ? 'following' : nowRequested ? 'requested' : 'none'
					cache.modify({
						id: cache.identify({ __typename: 'public_users', id: targetUserId }),
						fields: {
							isFollowing: () => nowFollowing,
							followStatus: () => newStatus,
							followers_count: (prev: number) => (prev ?? 0) + (nowFollowing ? 1 : -1),
						},
					})
				},
			}),
		)).pipe(map(res => ({
			userId: targetUserId,
			following: res?.data?.toggleFollow?.following ?? false,
			requested: res?.data?.toggleFollow?.requested ?? false,
		})))
	}

	respondFollowRequest(actorId: string, accept: boolean): Observable<RespondFollowRequestResult> {
		return from(firstValueFrom(
			this.apollo.mutate<{ respondFollowRequest: RespondFollowRequestResult }>({
				mutation: RESPOND_FOLLOW_REQUEST_MUTATION,
				variables: { actorId, accept },
			}),
		)).pipe(map(res => ({
			requestId: res?.data?.respondFollowRequest?.requestId ?? '',
			accepted: res?.data?.respondFollowRequest?.accepted ?? accept,
		})))
	}

	getFollowers(userId: string, limit: number): Observable<GqlFollowUser[]> {
		return this.fetchFollowList(FOLLOWERS_QUERY, 'followers', userId, limit)
	}

	getFollowing(userId: string, limit: number): Observable<GqlFollowUser[]> {
		return this.fetchFollowList(FOLLOWING_QUERY, 'following', userId, limit)
	}

	getSuggestedUsers(preferenceIds: string[], limit = 5): Observable<GqlSuggestedUser[]> {
		return from(firstValueFrom(
			this.apollo.query<{ suggestedUsers: GqlSuggestedUser[] }>({
				query: SUGGESTED_USERS_QUERY,
				variables: { preferenceIds, limit },
				fetchPolicy: 'network-only',
			}),
		)).pipe(map(res => res.data?.suggestedUsers ?? []))
	}

	private fetchFollowList(query: any, key: string, userId: string, limit: number): Observable<GqlFollowUser[]> {
		return from(firstValueFrom(
			this.apollo.query<Record<string, GqlFollowUser[]>>({
				query,
				variables: { userId, limit },
				fetchPolicy: 'network-only',
			}),
		)).pipe(map(res => res.data?.[key] ?? []))
	}
}
