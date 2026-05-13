import { Component, inject, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NotificationsStore } from '@core/store/notifications.store'
import { Notification, NotificationType } from '@core/models/notification/notification.model'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'

@Component({
	selector: 'app-notifications-page',
	imports: [AppShell, Avatar, RouterLink, TimeAgoPipe],
	templateUrl: './notifications-page.html',
})
export class NotificationsPage implements OnInit {
	readonly store = inject(NotificationsStore)

	ngOnInit(): void {
		this.store.load()
	}

	actorName(n: Notification): string {
		return n.actor?.fullName || n.actor?.username || 'Alguien'
	}

	notificationText(n: Notification): string {
		const map: Record<NotificationType, string> = {
			LIKE: 'le dio like a tu publicacion',
			COMMENT: 'comento tu publicacion',
			FOLLOW: 'empezo a seguirte',
			MENTION: 'te menciono en un comentario',
			RECIPE_SAVE: 'guardo tu receta',
		}
		return n.content ?? map[n.type] ?? 'interactuo con tu contenido'
	}

	notificationIcon(type: NotificationType): string {
		const map: Record<NotificationType, string> = {
			LIKE: 'pi pi-heart-fill text-red-500',
			COMMENT: 'pi pi-comment text-sky-500',
			FOLLOW: 'pi pi-user-plus text-green-500',
			MENTION: 'pi pi-at text-purple-500',
			RECIPE_SAVE: 'pi pi-bookmark-fill text-orange-500',
		}
		return map[type]
	}

	targetLink(n: Notification): string[] | null {
		if (!n.targetId) return null
		if (n.type === 'FOLLOW') return n.actor?.username ? ['/profile', n.actor.username] : null
		return ['/post', n.targetId]
	}
}
