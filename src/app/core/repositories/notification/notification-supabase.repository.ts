import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'
import { SupabaseService } from '@core/services/supabase.service'
import type { INotificationRepository, RawNotificationRow } from './notification-repository'

/**
 * Variable o constante para n o t i f i c a t i o n s e l e c t.
 */
const NOTIFICATION_SELECT = `
	id, user_id, actor_id, target_id, type, content, is_read, created_at,
	actor:users!actor_id(
		id,
		person_profiles(username, full_name, photo_url)
	)
`

/**
 * Repositorio de datos para notificationsupabase.
 */
@Injectable({ providedIn: 'root' })
export class NotificationSupabaseRepository implements INotificationRepository {
	/**
	 * Propiedad para gestionar supabase.
	 */
	private readonly supabase = inject(SupabaseService)

	/**
	 * Método para obtener notifications.
	 */
	getNotifications(userId: string, limit: number): Observable<RawNotificationRow[]> {
		return from(
			this.supabase.client
				.from('notifications')
				.select(NOTIFICATION_SELECT)
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(limit),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return (data ?? []) as unknown as RawNotificationRow[]
			}),
		)
	}

	/**
	 * Método para obtener notification.
	 */
	getNotification(notificationId: string): Observable<RawNotificationRow | null> {
		return from(
			this.supabase.client
				.from('notifications')
				.select(NOTIFICATION_SELECT)
				.eq('id', notificationId)
				.maybeSingle(),
		).pipe(
			map(({ data, error }) => {
				if (error) throw error
				return (data as unknown as RawNotificationRow) ?? null
			}),
		)
	}

	/**
	 * Método para mark as read.
	 */
	markAsRead(notificationId: string): Observable<void> {
		return from(
			this.supabase.client
				.from('notifications')
				.update({ is_read: true })
				.eq('id', notificationId),
		).pipe(map(({ error }) => { if (error) throw error }))
	}

	/**
	 * Método para mark todos as read.
	 */
	markAllAsRead(userId: string): Observable<void> {
		return from(
			this.supabase.client
				.from('notifications')
				.update({ is_read: true })
				.eq('user_id', userId)
				.eq('is_read', false),
		).pipe(map(({ error }) => { if (error) throw error }))
	}

	/**
	 * Método para subscribe to new.
	 */
	subscribeToNew(userId: string, onInsert: (row: Record<string, unknown>) => void): RealtimeChannel {
		return this.supabase.client
			.channel(`notifications:${userId}`)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
				payload => onInsert(payload.new as Record<string, unknown>),
			)
			.subscribe()
	}
}
