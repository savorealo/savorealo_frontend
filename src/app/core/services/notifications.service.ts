import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'
import { SupabaseService } from '@core/services/supabase.service'
import { Notification, NotificationActor, NotificationType } from '@core/models/notification/notification.model'

@Injectable({ providedIn: 'root' })
export class NotificationsService {
	private readonly supabase = inject(SupabaseService)

	getNotifications(userId: string, limit = 30): Observable<Notification[]> {
		return from(
			this.supabase.client
				.from('notifications')
				.select(`
					id, user_id, actor_id, target_id, type, content, is_read, created_at,
					actor:users!actor_id(
						id,
						person_profiles(username, full_name, photo_url)
					)
				`)
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(limit),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return (data ?? []).map(row => this.mapRow(row))
			}),
		)
	}

	getNotification(notificationId: string): Observable<Notification | null> {
		return from(
			this.supabase.client
				.from('notifications')
				.select(`
					id, user_id, actor_id, target_id, type, content, is_read, created_at,
					actor:users!actor_id(
						id,
						person_profiles(username, full_name, photo_url)
					)
				`)
				.eq('id', notificationId)
				.maybeSingle(),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return data ? this.mapRow(data) : null
			}),
		)
	}

	markAsRead(notificationId: string): Observable<void> {
		return from(
			this.supabase.client
				.from('notifications')
				.update({ is_read: true })
				.eq('id', notificationId),
		).pipe(map(({ error }) => { if (error) throw error }))
	}

	markAllAsRead(userId: string): Observable<void> {
		return from(
			this.supabase.client
				.from('notifications')
				.update({ is_read: true })
				.eq('user_id', userId)
				.eq('is_read', false),
		).pipe(map(({ error }) => { if (error) throw error }))
	}

	subscribeToNew(userId: string, onNew: (notification: Notification) => void): RealtimeChannel {
		return this.supabase.client
			.channel(`notifications:${userId}`)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
				payload => {
					const row = payload.new as Record<string, unknown>
					this.getNotification(row['id'] as string).subscribe({
						next: notification => onNew(notification ?? this.mapRow(row)),
						error: () => onNew(this.mapRow(row)),
					})
				},
			)
			.subscribe()
	}

	private mapRow(row: Record<string, unknown>): Notification {
		type PersonProfile = { username: string | null; full_name: string | null; photo_url: string | null }
		const actorRaw = row['actor'] as {
			id?: string
			username?: string | null
			display_name?: string | null
			avatar_url?: string | null
			person_profiles?: PersonProfile | PersonProfile[]
		} | null
		const personProfiles = actorRaw?.person_profiles
		const profile = Array.isArray(personProfiles)
			? personProfiles[0] ?? null
			: personProfiles ?? null

		const actor: NotificationActor | null = actorRaw
			? {
				id: actorRaw.id ?? (row['actor_id'] as string | null) ?? '',
				username: profile?.username ?? actorRaw.username ?? (row['username'] as string | null) ?? null,
				fullName: profile?.full_name ?? actorRaw.display_name ?? (row['display_name'] as string | null) ?? null,
				photoUrl: profile?.photo_url ?? actorRaw.avatar_url ?? (row['photo_url'] as string | null) ?? null,
			}
			: row['actor_id'] || row['username'] || row['photo_url']
				? {
					id: (row['actor_id'] as string | null) ?? '',
					username: (row['username'] as string | null) ?? null,
					fullName: (row['display_name'] as string | null) ?? null,
					photoUrl: (row['photo_url'] as string | null) ?? null,
				}
			: null

		return {
			id: row['id'] as string,
			userId: row['user_id'] as string,
			actorId: row['actor_id'] as string | null,
			actor,
			targetId: row['target_id'] as string | null,
			targetImageUrl: (row['target_image_url'] as string | null) ?? null,
			type: row['type'] as NotificationType,
			content: row['content'] as string | null,
			isRead: row['is_read'] as boolean,
			createdAt: new Date(row['created_at'] as string),
		}
	}
}
