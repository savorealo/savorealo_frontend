import { inject, Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Notification, NotificationActor, NotificationType } from '@core/models/notification/notification.model'
import { NOTIFICATION_REPOSITORY } from '@core/repositories/tokens/repository.tokens'
import type { RawNotificationRow } from '@core/repositories/notification/notification-repository'

/**
 * Servicio que provee la lógica de negocio para las notificaciones.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
	/**
	 * Propiedad para gestionar repo.
	 */
	private readonly repo = inject(NOTIFICATION_REPOSITORY)

	/**
	 * Método para obtener notifications.
	 */
	getNotifications(userId: string, limit = 30): Observable<Notification[]> {
		return this.repo.getNotifications(userId, limit).pipe(
			map(rows => rows.map(row => this.mapRow(row))),
		)
	}

	/**
	 * Método para obtener notification.
	 */
	getNotification(notificationId: string): Observable<Notification | null> {
		return this.repo.getNotification(notificationId).pipe(
			map(row => row ? this.mapRow(row) : null),
		)
	}

	/**
	 * Método para mark as read.
	 */
	markAsRead(notificationId: string): Observable<void> {
		return this.repo.markAsRead(notificationId)
	}

	/**
	 * Método para mark todos as read.
	 */
	markAllAsRead(userId: string): Observable<void> {
		return this.repo.markAllAsRead(userId)
	}

	/**
	 * Método para subscribe to new.
	 */
	subscribeToNew(userId: string, onNew: (notification: Notification) => void): RealtimeChannel {
		return this.repo.subscribeToNew(userId, row => {
			this.getNotification(row['id'] as string).subscribe({
				next: notification => onNew(notification ?? this.mapRow(row as unknown as RawNotificationRow)),
				error: () => onNew(this.mapRow(row as unknown as RawNotificationRow)),
			})
		})
	}

	/**
	 * Método para map row.
	 */
	mapRow(row: RawNotificationRow | Record<string, unknown>): Notification {
		type PersonProfile = { username: string | null; full_name: string | null; photo_url: string | null }
		const actorRaw = (row as Record<string, unknown>)['actor'] as {
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

		const r = row as Record<string, unknown>

		const actor: NotificationActor | null = actorRaw
			? {
				id: actorRaw.id ?? (r['actor_id'] as string | null) ?? '',
				username: profile?.username ?? actorRaw.username ?? (r['username'] as string | null) ?? null,
				fullName: profile?.full_name ?? actorRaw.display_name ?? (r['display_name'] as string | null) ?? null,
				photoUrl: profile?.photo_url ?? actorRaw.avatar_url ?? (r['photo_url'] as string | null) ?? null,
			}
			: r['actor_id'] || r['username'] || r['photo_url']
				? {
					id: (r['actor_id'] as string | null) ?? '',
					username: (r['username'] as string | null) ?? null,
					fullName: (r['display_name'] as string | null) ?? null,
					photoUrl: (r['photo_url'] as string | null) ?? null,
				}
			: null

		return {
			id: r['id'] as string,
			userId: r['user_id'] as string,
			actorId: r['actor_id'] as string | null,
			actor,
			targetId: r['target_id'] as string | null,
			targetImageUrl: (r['target_image_url'] as string | null) ?? null,
			type: r['type'] as NotificationType,
			content: r['content'] as string | null,
			isRead: r['is_read'] as boolean,
			createdAt: new Date(r['created_at'] as string),
		}
	}
}
