import { inject, Injectable } from '@angular/core'
import { map, Observable, of, switchMap } from 'rxjs'
import { StoryGroup, StoryItem, StoryType } from '@core/models/story/story.model'
import { STORY_REPOSITORY } from '@core/repositories/tokens/repository.tokens'
import type { StoryRow, StoryUserRow } from '@core/repositories/story/story-repository'

interface ResolvedProfile {
	username: string
	displayName: string
	avatarUrl: string | null
}

function firstOrSelf<T>(v: T | T[] | null | undefined): T | null {
	if (v == null) return null
	return Array.isArray(v) ? v[0] ?? null : v
}

@Injectable({ providedIn: 'root' })
export class StoriesService {
	private readonly repo = inject(STORY_REPOSITORY)

	getStories(currentUserId: string): Observable<StoryGroup[]> {
		const now = new Date().toISOString()

		return this.repo.getFollowedUserIds(currentUserId).pipe(
			switchMap(followedIds => {
				const allowedIds = [currentUserId, ...followedIds]
				return this.repo.getActiveStories(allowedIds, now)
			}),
			switchMap(rows => {
				if (!rows.length) return of([])

				const userIds = [...new Set(rows.map(s => s.user_id))]

				return this.repo.getUserProfiles(userIds).pipe(
					map(profileData => this.buildGroups(rows, profileData, currentUserId)),
				)
			}),
		)
	}

	markViewed(storyId: string, userId: string): Observable<void> {
		return this.repo.markViewed(storyId, userId)
	}

	createStory(userId: string, file: File): Observable<void> {
		const ext = file.name.split('.').pop() ?? 'jpg'
		const path = `${userId}/${Date.now()}.${ext}`
		const storyType: StoryType = file.type.startsWith('video') ? 'VIDEO' : 'PHOTO'
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

		return this.repo.uploadStoryMedia(path, file).pipe(
			switchMap(mediaUrl => this.repo.insertStory(userId, storyType, mediaUrl, expiresAt)),
		)
	}

	private buildGroups(rows: StoryRow[], profileData: StoryUserRow[], currentUserId: string): StoryGroup[] {
		const profileMap = new Map<string, ResolvedProfile>(
			profileData.map(user => [user.id, this.resolveProfile(user)]),
		)

		const items: StoryItem[] = rows.map(row => ({
			id: row.id,
			userId: row.user_id,
			storyType: row.story_type,
			mediaUrl: row.media_url,
			createdAt: row.created_at,
			expiresAt: row.expires_at,
			viewed: row.viewed.some(v => v.user_id === currentUserId),
		}))

		const groupMap = new Map<string, StoryGroup>()
		for (const item of items) {
			if (!groupMap.has(item.userId)) {
				const p = profileMap.get(item.userId)
				groupMap.set(item.userId, {
					userId: item.userId,
					username: p?.username ?? 'usuario',
					displayName: p?.displayName ?? 'Usuario',
					avatarUrl: p?.avatarUrl ?? null,
					stories: [],
					hasUnviewed: false,
				})
			}
			const group = groupMap.get(item.userId)!
			group.stories.push(item)
			if (!item.viewed) group.hasUnviewed = true
		}

		return Array.from(groupMap.values()).sort((a, b) => {
			if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1
			const aTime = new Date(a.stories.at(-1)!.createdAt).getTime()
			const bTime = new Date(b.stories.at(-1)!.createdAt).getTime()
			return bTime - aTime
		})
	}

	private resolveProfile(user: StoryUserRow): ResolvedProfile {
		const person = firstOrSelf(user.person_profiles as { username: string; full_name: string | null; photo_url: string | null } | { username: string; full_name: string | null; photo_url: string | null }[] | null)
		const business = firstOrSelf(user.business_profiles as { business_name: string; photo_url: string | null } | { business_name: string; photo_url: string | null }[] | null)

		if (user.user_type === 'PERSON') {
			return {
				username: person?.username ?? 'usuario',
				displayName: person?.full_name || person?.username || 'Usuario',
				avatarUrl: person?.photo_url ?? null,
			}
		}

		return {
			username: 'savorealo',
			displayName: business?.business_name ?? 'Negocio',
			avatarUrl: business?.photo_url ?? null,
		}
	}
}
