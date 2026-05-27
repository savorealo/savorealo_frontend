import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import { StoryType } from '@core/models/story/story.model'
import type { IStoryRepository, StoryRow, StoryUserRow } from './story-repository'

/**
 * Repositorio de datos para storysupabase.
 */
@Injectable({ providedIn: 'root' })
export class StorySupabaseRepository implements IStoryRepository {
	/**
	 * Propiedad para gestionar supabase.
	 */
	private readonly supabase = inject(SupabaseService)

	/**
	 * Método para obtener followed user ids.
	 */
	getFollowedUserIds(currentUserId: string): Observable<string[]> {
		return from(
			this.supabase.client
				.from('follows')
				.select('followed_id')
				.eq('follower_id', currentUserId),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return (data ?? []).map(f => f.followed_id)
			}),
		)
	}

	/**
	 * Método para obtener active stories.
	 */
	getActiveStories(userIds: string[], now: string): Observable<StoryRow[]> {
		return from(
			this.supabase.client
				.from('stories')
				.select('id, user_id, story_type, media_url, created_at, expires_at, viewed:viewed_stories(user_id)')
				.in('user_id', userIds)
				.gt('expires_at', now)
				.order('created_at', { ascending: true }),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return (data ?? []) as unknown as StoryRow[]
			}),
		)
	}

	/**
	 * Método para obtener user profiles.
	 */
	getUserProfiles(userIds: string[]): Observable<StoryUserRow[]> {
		return from(
			this.supabase.client
				.from('users')
				.select(`
					id,
					user_type,
					person_profiles(username, full_name, photo_url),
					business_profiles(business_name, photo_url)
				`)
				.in('id', userIds),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return (data ?? []) as unknown as StoryUserRow[]
			}),
		)
	}

	/**
	 * Método para mark viewed.
	 */
	markViewed(storyId: string, userId: string): Observable<void> {
		return from(
			this.supabase.client
				.from('viewed_stories')
				.upsert({ story_id: storyId, user_id: userId, viewed_at: new Date().toISOString() }),
		).pipe(map(({ error }) => { if (error) throw error }))
	}

	/**
	 * Método para upload story media.
	 */
	uploadStoryMedia(path: string, file: File): Observable<string> {
		return from(
			this.supabase.client.storage
				.from('stories')
				.upload(path, file, { upsert: true }),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				const { data: urlData } = this.supabase.client.storage
					.from('stories')
					.getPublicUrl(data.path)
				return urlData.publicUrl
			}),
		)
	}

	/**
	 * Método para insert story.
	 */
	insertStory(userId: string, storyType: StoryType, mediaUrl: string, expiresAt: string): Observable<void> {
		return from(
			this.supabase.client
				.from('stories')
				.insert({ user_id: userId, story_type: storyType, media_url: mediaUrl, expires_at: expiresAt }),
		).pipe(map(({ error }) => { if (error) throw error }))
	}
}
