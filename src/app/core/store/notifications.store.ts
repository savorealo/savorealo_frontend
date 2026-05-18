import { computed, DestroyRef, inject, Injectable } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { signal } from '@angular/core'
import { RealtimeChannel } from '@supabase/supabase-js'
import { finalize } from 'rxjs'
import { NotificationsService } from '@core/services/notifications.service'
import { AuthStore } from '@core/store/auth.store'
import { Notification, NotificationTab } from '@core/models/notification/notification.model'
import { toUserMessage } from '@core/utils/user-error'

@Injectable({ providedIn: 'root' })
export class NotificationsStore {
	private readonly service = inject(NotificationsService)
	private readonly auth = inject(AuthStore)
	private readonly destroyRef = inject(DestroyRef)

	private readonly _notifications = signal<Notification[]>([])
	private readonly _loading = signal(false)
	private readonly _error = signal<string | null>(null)
	private readonly _initialized = signal(false)
	private readonly _activeTab = signal<NotificationTab>('all')
	private channel: RealtimeChannel | null = null

	readonly notifications = this._notifications.asReadonly()
	readonly loading = this._loading.asReadonly()
	readonly error = this._error.asReadonly()
	readonly activeTab = this._activeTab.asReadonly()

	readonly unreadCount = computed(() => this._notifications().filter(n => !n.isRead).length)
	readonly mentionsCount = computed(() => this._notifications().filter(n => n.type === 'MENTION').length)
	readonly socialCount = computed(() =>
		this._notifications().filter(n => ['FOLLOW', 'LIKE', 'RECIPE_SAVE'].includes(n.type)).length,
	)
	readonly isEmpty = computed(() => !this._loading() && this._notifications().length === 0)

	readonly filteredNotifications = computed(() => {
		const tab = this._activeTab()
		const all = this._notifications()
		switch (tab) {
			case 'unread': return all.filter(n => !n.isRead)
			case 'mentions': return all.filter(n => n.type === 'MENTION')
			case 'social': return all.filter(n => ['FOLLOW', 'LIKE', 'RECIPE_SAVE'].includes(n.type))
			default: return all
		}
	})

	load(): void {
		const userId = this.auth.currentUserId()
		if (!userId || this._initialized()) return

		this._loading.set(true)
		this._initialized.set(true)
		this._error.set(null)

		this.service.getNotifications(userId).pipe(
			finalize(() => this._loading.set(false)),
			takeUntilDestroyed(this.destroyRef),
		).subscribe({
			next: notifications => {
				this._notifications.set(notifications)
				this.subscribeRealtime(userId)
			},
			error: err => this._error.set(toUserMessage(err, 'No se pudieron cargar las notificaciones')),
		})
	}

	setTab(tab: NotificationTab): void {
		this._activeTab.set(tab)
	}

	markRead(notification: Notification): void {
		if (notification.isRead) return
		this._notifications.update(list =>
			list.map(n => n.id === notification.id ? { ...n, isRead: true } : n),
		)
		this.service.markAsRead(notification.id).subscribe()
	}

	markAllRead(): void {
		const userId = this.auth.currentUserId()
		if (!userId) return
		this._notifications.update(list => list.map(n => ({ ...n, isRead: true })))
		this.service.markAllAsRead(userId).subscribe()
	}

	private subscribeRealtime(userId: string): void {
		this.channel?.unsubscribe()
		this.channel = this.service.subscribeToNew(userId, notification => {
			this._notifications.update(list => [notification, ...list])
		})
	}

	ngOnDestroy(): void {
		this.channel?.unsubscribe()
	}
}
