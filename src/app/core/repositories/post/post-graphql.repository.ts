import { inject, Injectable } from '@angular/core'
import { Apollo } from 'apollo-angular'
import { firstValueFrom, from, map, Observable } from 'rxjs'
import {
	CREATE_POST_MUTATION, DISCOVER_FEED_QUERY, HOME_FEED_QUERY, LIKED_POSTS_QUERY,
	POST_CARD_FRAGMENT, SAVED_POSTS_QUERY, TOGGLE_LIKE_MUTATION,
	TOGGLE_SAVE_MUTATION, USER_POSTS_QUERY,
} from '@graphql/feed.mutations'
import type { GqlPostNode, IPostRepository, SavedPostsResult, ToggleLikeResult, ToggleSaveResult } from './post-repository'

@Injectable({ providedIn: 'root' })
export class PostGraphqlRepository implements IPostRepository {
	private readonly apollo = inject(Apollo)

	fetchHomeFeed(limit: number, offset: number): Observable<GqlPostNode[]> {
		return from(firstValueFrom(
			this.apollo.query<{ feed: GqlPostNode[] }>({
				query: HOME_FEED_QUERY,
				variables: { limit, offset },
				fetchPolicy: 'network-only',
			}),
		)).pipe(map(res => res.data?.feed ?? []))
	}

	fetchDiscoverFeed(limit: number, offset: number, category: string | null): Observable<GqlPostNode[]> {
		return from(firstValueFrom(
			this.apollo.query<{ discoverFeed: GqlPostNode[] }>({
				query: DISCOVER_FEED_QUERY,
				variables: { limit, offset, category: category ?? undefined },
				fetchPolicy: 'network-only',
			}),
		)).pipe(map(res => res.data?.discoverFeed ?? []))
	}

	fetchSavedPosts(limit: number, cursor: string | null): Observable<SavedPostsResult> {
		return from(firstValueFrom(
			this.apollo.query<{ savedPosts: { posts: GqlPostNode[]; nextCursor: string | null; hasNextPage: boolean } }>({
				query: SAVED_POSTS_QUERY,
				variables: { limit, cursor: cursor ?? undefined },
				fetchPolicy: 'network-only',
			}),
		)).pipe(map(res => {
			const data = res.data?.savedPosts
			return {
				posts: data?.posts ?? [],
				nextCursor: data?.nextCursor ?? null,
				hasNextPage: data?.hasNextPage ?? false,
			}
		}))
	}

	fetchLikedPosts(limit: number, offset: number): Observable<GqlPostNode[]> {
		return from(firstValueFrom(
			this.apollo.query<{ likedPosts: GqlPostNode[] }>({
				query: LIKED_POSTS_QUERY,
				variables: { limit, offset },
				fetchPolicy: 'network-only',
			}),
		)).pipe(map(res => res.data?.likedPosts ?? []))
	}

	fetchUserPosts(userId: string, limit: number, offset: number): Observable<GqlPostNode[]> {
		return from(firstValueFrom(
			this.apollo.query<{ userPosts: GqlPostNode[] }>({
				query: USER_POSTS_QUERY,
				variables: { userId, limit, offset },
				fetchPolicy: 'network-only',
			}),
		)).pipe(map(res => res.data?.userPosts ?? []))
	}

	readPostFromCache(id: string): GqlPostNode | null {
		try {
			const node = this.apollo.client.cache.readFragment<GqlPostNode>({
				id: this.apollo.client.cache.identify({ __typename: 'posts', id }) ?? `posts:${id}`,
				fragment: POST_CARD_FRAGMENT,
				fragmentName: 'PostCardFields',
			})
			return node?.id ? node : null
		} catch {
			return null
		}
	}

	toggleLike(postId: string): Observable<ToggleLikeResult> {
		return from(firstValueFrom(
			this.apollo.mutate<{ toggleLike: ToggleLikeResult }>({
				mutation: TOGGLE_LIKE_MUTATION,
				variables: { postId },
				update: (cache, { data }) => {
					const result = data?.toggleLike
					if (!result) return
					cache.modify({
						id: cache.identify({ __typename: 'posts', id: postId }),
						fields: {
							liked: () => result.liked,
							likes_count: () => result.likes,
						},
					})
				},
			}),
		)).pipe(map(res => {
			const data = res.data?.toggleLike
			return { postId, liked: !!data?.liked, likes: data?.likes ?? 0 }
		}))
	}

	toggleSave(postId: string): Observable<ToggleSaveResult> {
		return from(firstValueFrom(
			this.apollo.mutate<{ toggleSave: ToggleSaveResult }>({
				mutation: TOGGLE_SAVE_MUTATION,
				variables: { postId },
				update: (cache, { data }) => {
					const result = data?.toggleSave
					if (!result) return
					cache.modify({
						id: cache.identify({ __typename: 'posts', id: postId }),
						fields: {
							saved: () => result.saved,
							saves_count: () => result.saves,
						},
					})
				},
			}),
		)).pipe(map(res => ({ postId, saved: !!res.data?.toggleSave?.saved, saves: res.data?.toggleSave?.saves ?? 0 })))
	}

	createPost(input: { content: string; title?: string | null; imageUrl?: string | null }): Observable<GqlPostNode> {
		return from(firstValueFrom(
			this.apollo.mutate<{ createPost: GqlPostNode }>({
				mutation: CREATE_POST_MUTATION,
				variables: {
					content:  input.content,
					title:    input.title ?? null,
					imageUrl: input.imageUrl ?? null,
				},
			}),
		)).pipe(map(res => {
			const post = res.data?.createPost
			if (!post) throw new Error('No se pudo crear el post')
			return post
		}))
	}
}
