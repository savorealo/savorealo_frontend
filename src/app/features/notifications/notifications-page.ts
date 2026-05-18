import { Component, computed, inject, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { isToday, isYesterday, isThisWeek } from 'date-fns'
import { NotificationsStore } from '@core/store/notifications.store'
import { Notification, NotificationGroup, NotificationTab, NotificationType } from '@core/models/notification/notification.model'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'

interface Tab {
	key: NotificationTab
	label: string
	count: number
}

@Component({
	selector: 'app-notifications-page',
	imports: [AppShell, Avatar, RouterLink, TimeAgoPipe],
	templateUrl: './notifications-page.html',
})
export class NotificationsPage implements OnInit {
	readonly store = inject(NotificationsStore)

	readonly tabs = computed<Tab[]>(() => [
		{ key: 'all', label: 'Todas', count: this.store.notifications().length },
		{ key: 'unread', label: 'No leídas', count: this.store.unreadCount() },
		{ key: 'mentions', label: 'Menciones', count: this.store.mentionsCount() },
		{ key: 'social', label: 'Sociales', count: this.store.socialCount() },
	])

	readonly groups = computed<NotificationGroup[]>(() =>
		this.groupByDate(this.store.filteredNotifications()),
	)

	ngOnInit(): void {
		this.store.load()
	}

	actorName(n: Notification): string {
		return n.actor?.fullName || n.actor?.username || 'Alguien'
	}

	notificationText(n: Notification): string {
		const map: Record<NotificationType, string> = {
			LIKE: 'le ha gustado tu receta',
			COMMENT: 'ha comentado',
			FOLLOW: 'ha empezado a seguirte',
			MENTION: 'te ha mencionado en un comentario',
			RECIPE_SAVE: 'ha guardado tu receta',
		}
		return map[n.type] ?? 'interactuó con tu contenido'
	}

	notificationIcon(type: NotificationType): string {
		const map: Record<NotificationType, string> = {
			LIKE: 'pi pi-heart-fill text-rose-500',
			COMMENT: 'pi pi-comment text-sky-500',
			FOLLOW: 'pi pi-user-plus text-green-500',
			MENTION: 'pi pi-at text-purple-500',
			RECIPE_SAVE: 'pi pi-bookmark-fill text-primary',
		}
		return map[type]
	}

	chipLabel(type: NotificationType): string {
		const map: Record<NotificationType, string> = {
			LIKE: 'Me gusta',
			COMMENT: 'Comentario',
			FOLLOW: 'Nuevo seguidor',
			MENTION: 'Mención',
			RECIPE_SAVE: 'Guardado',
		}
		return map[type]
	}

	chipClass(type: NotificationType): string {
		const map: Record<NotificationType, string> = {
			LIKE: 'bg-rose-100 text-rose-600',
			COMMENT: 'bg-sky-100 text-sky-600',
			FOLLOW: 'bg-amber-100 text-amber-700',
			MENTION: 'bg-purple-100 text-purple-600',
			RECIPE_SAVE: 'bg-primary-container text-on-primary-container',
		}
		return map[type]
	}

	hasPostThumbnail(n: Notification): boolean {
		return ['LIKE', 'COMMENT', 'MENTION', 'RECIPE_SAVE'].includes(n.type) && !!n.targetId
	}

	targetLink(n: Notification): string[] | null {
		if (!n.targetId) return null
		if (n.type === 'FOLLOW') return n.actor?.username ? ['/profile', n.actor.username] : null
		return ['/post', n.targetId]
	}

	private groupByDate(notifications: Notification[]): NotificationGroup[] {
		const today: Notification[] = []
		const yesterday: Notification[] = []
		const thisWeek: Notification[] = []
		const older: Notification[] = []

		for (const n of notifications) {
			if (isToday(n.createdAt)) today.push(n)
			else if (isYesterday(n.createdAt)) yesterday.push(n)
			else if (isThisWeek(n.createdAt)) thisWeek.push(n)
			else older.push(n)
		}

		const groups: NotificationGroup[] = []
		if (today.length) groups.push({ label: 'Hoy', notifications: today })
		if (yesterday.length) groups.push({ label: 'Ayer', notifications: yesterday })
		if (thisWeek.length) groups.push({ label: 'Esta semana', notifications: thisWeek })
		if (older.length) groups.push({ label: 'Antes', notifications: older })
		return groups
	}
}
