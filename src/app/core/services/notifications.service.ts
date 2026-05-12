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
				payload => onNew(this.mapRow(payload.new as Record<string, unknown>)),
			)
			.subscribe()
	}

	private mapRow(row: Record<string, unknown>): Notification {
		const actorRaw = row['actor'] as { id: string; person_profiles: { username: string; full_name: string; photo_url: string }[] } | null
		const profile = actorRaw?.person_profiles?.[0] ?? null

		const actor: NotificationActor | null = actorRaw
			? {
				id: actorRaw.id,
				username: profile?.username ?? null,
				fullName: profile?.full_name ?? null,
				photoUrl: profile?.photo_url ?? null,
			}
			: null

		return {
			id: row['id'] as string,
			userId: row['user_id'] as string,
			actorId: row['actor_id'] as string | null,
			actor,
			targetId: row['target_id'] as string | null,
			type: row['type'] as NotificationType,
			content: row['content'] as string | null,
			isRead: row['is_read'] as boolean,
			createdAt: new Date(row['created_at'] as string),
		}
	}
}
