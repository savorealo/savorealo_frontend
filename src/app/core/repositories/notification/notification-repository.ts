import { Observable } from 'rxjs'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface RawNotificationRow {
	id: string
	user_id: string
	actor_id: string | null
	target_id: string | null
	target_image_url: string | null
	type: string
	content: string | null
	is_read: boolean
	created_at: string
	actor: {
		id?: string
		username?: string | null
		display_name?: string | null
		avatar_url?: string | null
		person_profiles?: { username: string | null; full_name: string | null; photo_url: string | null } | { username: string | null; full_name: string | null; photo_url: string | null }[]
	} | null
}

export interface INotificationRepository {
	getNotifications(userId: string, limit: number): Observable<RawNotificationRow[]>
	getNotification(notificationId: string): Observable<RawNotificationRow | null>
	markAsRead(notificationId: string): Observable<void>
	markAllAsRead(userId: string): Observable<void>
	subscribeToNew(userId: string, onInsert: (row: Record<string, unknown>) => void): RealtimeChannel
}
