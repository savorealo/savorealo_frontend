import { inject, Injectable } from '@angular/core'
import { from, map, Observable, of, switchMap } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import { StoryGroup, StoryItem, StoryType } from '@core/models/story/story.model'
import { UserType } from '@core/models/user/user.model'

interface StoryRow {
	id: string
	user_id: string
	story_type: StoryType
	media_url: string
	created_at: string
	expires_at: string
	viewed: { user_id: string }[]
}

interface UserRow {
	id: string
	user_type: UserType
	person_profiles: {
		username: string
		full_name: string | null
		photo_url: string | null
	}[] | null
	business_profiles: {
		business_name: string
		photo_url: string | null
	}[] | null
}

interface ResolvedProfile {
	username: string
	displayName: string
	avatarUrl: string | null
}

@Injectable({ providedIn: 'root' })
export class StoriesService {
	private readonly supabase = inject(SupabaseService)

	getStories(currentUserId: string): Observable<StoryGroup[]> {
		const now = new Date().toISOString()

		const stories$ = from(
			this.supabase.client
				.from('stories')
				.select('id, user_id, story_type, media_url, created_at, expires_at, viewed:viewed_stories(user_id)')
				.gt('expires_at', now)
				.order('created_at', { ascending: true }),
		)

		return stories$.pipe(
			switchMap(({ data, error }) => {
				if (error) throw error
				const rows = (data ?? []) as unknown as StoryRow[]
				if (!rows.length) return of([])

				const userIds = [...new Set(rows.map(s => s.user_id))]

				const profiles$ = from(
					this.supabase.client
						.from('users')
						.select(`
							id,
							user_type,
							person_profiles(username, full_name, photo_url),
							business_profiles(business_name, photo_url)
						`)
						.in('id', userIds),
				)

				return profiles$.pipe(
					map(({ data: profileData, error: err2 }) => {
						if (err2) throw err2

						const profileMap = new Map<string, ResolvedProfile>(
							((profileData ?? []) as unknown as UserRow[]).map(user => [
								user.id,
								this.resolveProfile(user),
							]),
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
					}),
				)
			}),
		)
	}

	markViewed(storyId: string, userId: string): Observable<void> {
		return from(
			this.supabase.client
				.from('viewed_stories')
				.upsert({ story_id: storyId, user_id: userId, viewed_at: new Date().toISOString() }),
		).pipe(map(({ error }) => { if (error) throw error }))
	}

	createStory(userId: string, file: File): Observable<void> {
		const ext = file.name.split('.').pop() ?? 'jpg'
		const path = `${userId}/${Date.now()}.${ext}`
		const storyType: StoryType = file.type.startsWith('video') ? 'VIDEO' : 'PHOTO'
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

		const upload$ = from(
			this.supabase.client.storage
				.from('stories')
				.upload(path, file, { upsert: true }),
		)

		return upload$.pipe(
			switchMap(({ data, error }) => {
				if (error) throw error
				const { data: urlData } = this.supabase.client.storage
					.from('stories')
					.getPublicUrl(data.path)

				return from(
					this.supabase.client
						.from('stories')
						.insert({ user_id: userId, story_type: storyType, media_url: urlData.publicUrl, expires_at: expiresAt }),
				)
			}),
			map(({ error }) => { if (error) throw error }),
		)
	}

	private resolveProfile(user: UserRow): ResolvedProfile {
		const person = user.person_profiles?.[0] ?? null
		const business = user.business_profiles?.[0] ?? null

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
