import { inject, Injectable } from '@angular/core'
import { map, Observable, of, switchMap } from 'rxjs'
import { User } from '@core/models/user/User'
import { Post } from '@core/models/post/post.model'
import { FeedService } from '@core/services/feed.service'
import { POST_REPOSITORY, USER_REPOSITORY } from '@core/repositories/tokens/repository.tokens'
import type { GqlUser } from '@core/repositories/user/user-repository'

/**
 * Interfaz que define la estructura o contrato de datos para publicuser.
 */
export interface PublicUser extends User {
	/**
	 * Indicador booleano para es o está followed por current user.
	 */
	isFollowedByCurrentUser: boolean
	/**
	 * Propiedad para gestionar follow status.
	 */
	followStatus: 'none' | 'following' | 'requested'
	/**
	 * Indicador booleano para es o está private.
	 */
	isPrivate: boolean
	/**
	 * Indicador booleano para es o está viewable.
	 */
	isViewable: boolean
	/**
	 * Propiedad para gestionar follows you.
	 */
	followsYou: boolean
}

/**
 * Interfaz que define la estructura o contrato de datos para followlistuser.
 */
export interface FollowListUser {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string | null
	/**
	 * Propiedad para gestionar display nombre.
	 */
	displayName: string | null
	/**
	 * Propiedad para gestionar avatar enlace.
	 */
	avatarUrl: string | null
	/**
	 * Propiedad para gestionar follow status.
	 */
	followStatus: 'none' | 'following' | 'requested'
}

/**
 * Componente principal para la vista o página de userposts.
 */
export interface UserPostsPage {
	/**
	 * Propiedad para gestionar posts.
	 */
	posts: Post[]
	/**
	 * Propiedad para gestionar end cursor.
	 */
	endCursor: string | null
	/**
	 * Indicador booleano para tiene next page.
	 */
	hasNextPage: boolean
	/**
	 * Propiedad para gestionar total cantidad.
	 */
	totalCount: number
}

/**
 * Servicio que provee la lógica de negocio para el usuario o chef.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
	/**
	 * Propiedad para gestionar user repo.
	 */
	private readonly userRepo = inject(USER_REPOSITORY)
	/**
	 * Propiedad para gestionar post repo.
	 */
	private readonly postRepo = inject(POST_REPOSITORY)
	/**
	 * Propiedad para gestionar feed svc.
	 */
	private readonly feedSvc  = inject(FeedService)

	/**
	 * Método para obtener user por nombre de usuario.
	 */
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

	/**
	 * Método para obtener user por identificador.
	 */
	getUserById(userId: string): Observable<{ data: User }> {
		return this.userRepo.getUserById(userId).pipe(
			map(u => {
				if (!u) throw new Error('Usuario no encontrado')
				return { data: this.mapUser(u) }
			}),
		)
	}

	/**
	 * Método para obtener user posts.
	 */
	getUserPosts(userId: string, limit = 12, offset = 0): Observable<UserPostsPage> {
		return this.postRepo.fetchUserPosts(userId, limit, offset).pipe(
			map(nodes => {
				const posts = nodes.map(n => this.feedSvc.mapGqlPost(n))
				return { posts, endCursor: null, hasNextPage: false, totalCount: posts.length }
			}),
		)
	}

	/**
	 * Método para check nombre de usuario.
	 */
	checkUsername(username: string): Observable<{ valid: boolean; available: boolean; reason: string | null }> {
		return this.userRepo.checkUsername(username)
	}

	/**
	 * Método para alternar follow.
	 */
	toggleFollow(targetUserId: string, _currentlyFollowing: boolean): Observable<{ following: boolean; requested: boolean }> {
		return this.userRepo.toggleFollow(targetUserId).pipe(
			map(res => ({ following: res.following, requested: res.requested })),
		)
	}

	/**
	 * Método para respond follow request.
	 */
	respondFollowRequest(actorId: string, accept: boolean): Observable<{ requestId: string; accepted: boolean }> {
		return this.userRepo.respondFollowRequest(actorId, accept)
	}

	/**
	 * Método para obtener followers.
	 */
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

	/**
	 * Método para obtener following.
	 */
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

	/**
	 * Método para map public user.
	 */
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

	/**
	 * Método para map user.
	 */
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
