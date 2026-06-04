import { computed, DestroyRef, effect, inject, Injectable, untracked } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { signal } from '@angular/core'
import { RealtimeChannel } from '@supabase/supabase-js'
import { finalize } from 'rxjs'
import { NotificationsService } from '@core/services/notifications.service'
import { AuthStore } from '@core/store/auth.store'
import { Notification, NotificationTab } from '@core/models/notification/notification.model'
import { toUserMessage } from '@core/utils/user-error'

/**
 * Almacén de estado reactivo para gestionar la lógica de las notificaciones.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsStore {
	/**
	 * Propiedad para gestionar service.
	 */
	private readonly service = inject(NotificationsService)
	/**
	 * Propiedad para gestionar auth.
	 */
	private readonly auth = inject(AuthStore)
	/**
	 * Propiedad para gestionar destroy ref.
	 */
	private readonly destroyRef = inject(DestroyRef)

	/**
	 * Propiedad para gestionar notifications.
	 */
	private readonly _notifications = signal<Notification[]>([])
	/**
	 * Propiedad para gestionar cargando.
	 */
	private readonly _loading = signal(false)
	/**
	 * Propiedad para gestionar error.
	 */
	private readonly _error = signal<string | null>(null)
	/**
	 * Propiedad para gestionar initialized.
	 */
	private readonly _initialized = signal(false)
	/**
	 * Propiedad para gestionar active tab.
	 */
	private readonly _activeTab = signal<NotificationTab>('all')
	/**
	 * Propiedad para gestionar channel.
	 */
	private channel: RealtimeChannel | null = null

	/**
	 * Propiedad para gestionar notifications.
	 */
	readonly notifications = this._notifications.asReadonly()
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading = this._loading.asReadonly()
	/**
	 * Propiedad para gestionar error.
	 */
	readonly error = this._error.asReadonly()
	/**
	 * Propiedad para gestionar active tab.
	 */
	readonly activeTab = this._activeTab.asReadonly()

	/**
	 * Propiedad para gestionar unread cantidad.
	 */
	readonly unreadCount = computed(() => this._notifications().filter(n => !n.isRead).length)
	/**
	 * Propiedad para gestionar mentions cantidad.
	 */
	readonly mentionsCount = computed(() => this._notifications().filter(n => n.type === 'MENTION').length)
	/**
	 * Propiedad para gestionar social cantidad.
	 */
	readonly socialCount = computed(() =>
		this._notifications().filter(n => ['FOLLOW', 'FOLLOW_REQUEST', 'LIKE', 'RECIPE_SAVE'].includes(n.type)).length,
	)
	/**
	 * Indicador booleano para es o está empty.
	 */
	readonly isEmpty = computed(() => !this._loading() && this._notifications().length === 0)

	/**
	 * Propiedad para gestionar filtered notifications.
	 */
	readonly filteredNotifications = computed(() => {
		const tab = this._activeTab()
		const all = this._notifications()
		switch (tab) {
			case 'unread': return all.filter(n => !n.isRead)
			case 'mentions': return all.filter(n => n.type === 'MENTION')
			case 'social': return all.filter(n => ['FOLLOW', 'FOLLOW_REQUEST', 'LIKE', 'RECIPE_SAVE'].includes(n.type))
			default: return all
		}
	})

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
	constructor() {
		effect(() => {
			const userId = this.auth.currentUserId()
			if (userId) untracked(() => this.load())
		})
	}

	/**
	 * Método para cargar.
	 */
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
			error: err => {
				this._initialized.set(false)
				this._error.set(toUserMessage(err, 'No se pudieron cargar las notificaciones'))
			},
		})
	}

	/**
	 * Método para establecer tab.
	 */
	setTab(tab: NotificationTab): void {
		this._activeTab.set(tab)
	}

	/**
	 * Método para mark read.
	 */
	markRead(notification: Notification): void {
		if (notification.isRead) return
		this._notifications.update(list =>
			list.filter(n => n.id !== notification.id),
		)
		this.service.markAsRead(notification.id).subscribe()
	}

	/**
	 * Método para mark todos read.
	 */
	markAllRead(): void {
		const userId = this.auth.currentUserId()
		if (!userId) return
		this._notifications.set([])
		this.service.markAllAsRead(userId).subscribe()
	}

	/**
	 * Método para subscribe realtime.
	 */
	private subscribeRealtime(userId: string): void {
		this.channel?.unsubscribe()
		this.channel = this.service.subscribeToNew(userId, notification => {
			this._notifications.update(list => [notification, ...list])
		})
	}

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al destruir el componente para liberar recursos.
	 */
	ngOnDestroy(): void {
		this.channel?.unsubscribe()
	}
}
