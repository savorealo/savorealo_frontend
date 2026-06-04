import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { isToday, isYesterday, isThisWeek } from 'date-fns'
import { NotificationsStore } from '@core/store/notifications.store'
import { UserService } from '@core/services/user.service'
import { SupabaseService } from '@core/services/supabase.service'
import { AuthStore } from '@core/store/auth.store'
import { Notification, NotificationGroup, NotificationTab, NotificationType } from '@core/models/notification/notification.model'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'
import { SavoLoader } from '@shared/components/savo-loader/savo-loader'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Interfaz que representa una pestaña de filtro en la página de notificaciones.
 */
interface Tab {
	/**
	 * Categoría o tipo de pestaña de notificaciones.
	 */
	key: NotificationTab
	/**
	 * Clave de traducción de la etiqueta visible.
	 */
	label: string
	/**
	 * Número de notificaciones contabilizadas en esta pestaña.
	 */
	count: number
}

/**
 * Componente que representa la página del Centro de Notificaciones.
 * Muestra alertas agrupadas cronológicamente (likes, comentarios, seguimientos, menciones)
 * y permite gestionar solicitudes de seguimiento interactuando con Supabase y el UserService.
 */
@Component({
	selector: 'app-notifications-page',
	imports: [AppShell, Avatar, RouterLink, TimeAgoPipe, SavoLoader, TranslatePipe],
	templateUrl: './notifications-page.html',
})
export class NotificationsPage implements OnInit {
	/**
	 * Almacén de estado reactivo de las notificaciones.
	 */
	readonly store = inject(NotificationsStore)

	/**
	 * Servicio inyectado para gestionar solicitudes de seguimiento y usuarios.
	 */
	private readonly userService = inject(UserService)

	/**
	 * Servicio Supabase inyectado para realizar pre-consultas optimizadas de seguimiento.
	 */
	private readonly supabase = inject(SupabaseService)

	/**
	 * Almacén de estado de autenticación de usuario.
	 */
	private readonly authStore = inject(AuthStore)

	/**
	 * Servicio de enrutador inyectado para la navegación interna.
	 */
	private readonly router = inject(Router)

	/**
	 * Registro de respuestas guardadas localmente ante solicitudes de seguimiento (aceptadas/rechazadas) en la vista actual.
	 */
	readonly requestResponses = signal<Record<string, 'accepted' | 'rejected'>>({})

	/**
	 * Registro local reactivo del estado de seguimiento recíproco con los autores de las notificaciones.
	 */
	readonly followStates = signal<Record<string, 'following' | 'requested'>>({})

	/**
	 * Estado de carga (spinner) de las solicitudes de seguimiento en proceso de respuesta.
	 */
	readonly loadingRequests = signal<Record<string, boolean>>({})

	/**
	 * Estado de carga (spinner) asíncrono para las acciones de seguimiento optimista.
	 */
	readonly loadingFollows = signal<Record<string, boolean>>({})

	/**
	 * Señal calculada con las pestañas disponibles de filtrado de notificaciones (todas, no leídas, menciones, social).
	 */
	readonly tabs = computed<Tab[]>(() => [
		{ key: 'all', label: 'notifications.tab.all', count: this.store.notifications().length },
		{ key: 'unread', label: 'notifications.tab.unread', count: this.store.unreadCount() },
		{ key: 'mentions', label: 'notifications.tab.mentions', count: this.store.mentionsCount() },
		{ key: 'social', label: 'notifications.tab.social', count: this.store.socialCount() },
	])

	/**
	 * Señal calculada que agrupa la colección filtrada de notificaciones por su antigüedad temporal.
	 */
	readonly groups = computed<NotificationGroup[]>(() =>
		this.groupByDate(this.store.filteredNotifications()),
	)

	/**
	 * Inicializa el componente.
	 * Registra un efecto reactivo para pre-cargar el estado de seguimiento recíproco con los autores de las notificaciones cargadas.
	 */
	constructor() {
		// When notifications load, check which FOLLOW/FOLLOW_REQUEST actors we already follow
		effect(() => {
			const notifications = this.store.notifications()
			const userId = this.authStore.currentUserId()
			if (!userId || notifications.length === 0) return

			const socialNotifs = notifications.filter(n => n.type === 'FOLLOW' || n.type === 'FOLLOW_REQUEST')
			const actorIds = [...new Set(socialNotifs.map(n => n.actor?.id ?? n.actorId).filter(Boolean))] as string[]
			if (actorIds.length === 0) return

			untracked(() => this.preloadFollowStates(userId, actorIds))
		})
	}

	/**
	 * Método de ciclo de vida de Angular para disparar la carga asíncrona inicial de notificaciones.
	 */
	ngOnInit(): void {
		this.store.load()
	}

	/**
	 * Pre-carga desde base de datos de forma paralela los estados de seguimiento para evitar desincronizaciones visuales.
	 */
	private async preloadFollowStates(currentUserId: string, actorIds: string[]): Promise<void> {
		const [followsRes, requestsRes] = await Promise.all([
			this.supabase.client
				.from('follows')
				.select('followed_id')
				.eq('follower_id', currentUserId)
				.in('followed_id', actorIds),
			this.supabase.client
				.from('follow_requests')
				.select('target_id')
				.eq('requester_id', currentUserId)
				.eq('status', 'PENDING')
				.in('target_id', actorIds),
		])

		const updates: Record<string, 'following' | 'requested'> = {}
		for (const r of followsRes.data ?? []) {
			updates[(r as { followed_id: string }).followed_id] = 'following'
		}
		for (const r of requestsRes.data ?? []) {
			const id = (r as { target_id: string }).target_id
			if (!updates[id]) updates[id] = 'requested'
		}
		if (Object.keys(updates).length > 0) {
			this.followStates.update(m => ({ ...m, ...updates }))
		}
	}

	/**
	 * Devuelve el nombre del usuario o actor que generó la notificación.
	 * @param n Notificación a analizar.
	 */
	actorName(n: Notification): string {
		return n.actor?.fullName || n.actor?.username || 'Alguien'
	}

	/**
	 * Devuelve la clave de traducción correspondiente para el texto de la notificación según su tipología.
	 * @param n Notificación.
	 */
	notificationTextKey(n: Notification): string {
		if (n.content && n.type !== 'COMMENT') return n.content
		const map: Record<NotificationType, string> = {
			LIKE: 'notifications.text.like',
			COMMENT: 'notifications.text.comment',
			FOLLOW: 'notifications.text.follow',
			FOLLOW_REQUEST: 'notifications.text.follow_request',
			FOLLOW_ACCEPTED: 'notifications.text.follow_accepted',
			MENTION: 'notifications.text.mention',
			RECIPE_SAVE: 'notifications.text.recipe_save',
		}
		return map[n.type] ?? 'notifications.text.default'
	}

	/**
	 * Devuelve las clases de PrimeIcons e indicaciones de color en base al tipo de la notificación.
	 * @param type Tipo de notificación.
	 */
	notificationIcon(type: NotificationType): string {
		const map: Record<NotificationType, string> = {
			LIKE: 'pi pi-heart-fill text-rose-500',
			COMMENT: 'pi pi-comment text-sky-500',
			FOLLOW: 'pi pi-user-plus text-green-500',
			FOLLOW_REQUEST: 'pi pi-user-plus text-amber-500',
			FOLLOW_ACCEPTED: 'pi pi-check-circle text-green-500',
			MENTION: 'pi pi-at text-purple-500',
			RECIPE_SAVE: 'pi pi-bookmark-fill text-primary',
		}
		return map[type]
	}

	/**
	 * Devuelve la clave de traducción de la etiqueta representativa (chip) de categoría.
	 * @param type Tipo de la notificación.
	 */
	chipLabelKey(type: NotificationType): string {
		const map: Record<NotificationType, string> = {
			LIKE: 'notifications.chip.like',
			COMMENT: 'notifications.chip.comment',
			FOLLOW: 'notifications.chip.follow',
			FOLLOW_REQUEST: 'notifications.chip.follow_request',
			FOLLOW_ACCEPTED: 'notifications.chip.follow_accepted',
			MENTION: 'notifications.chip.mention',
			RECIPE_SAVE: 'notifications.chip.recipe_save',
		}
		return map[type] ?? ''
	}

	/**
	 * Devuelve la clase CSS de estilos visuales para pintar el chip de la categoría correspondiente.
	 * @param type Tipo de notificación.
	 */
	chipClass(type: NotificationType): string {
		const map: Record<NotificationType, string> = {
			LIKE: 'bg-rose-100 text-rose-600',
			COMMENT: 'bg-sky-100 text-sky-600',
			FOLLOW: 'bg-amber-100 text-amber-700',
			FOLLOW_REQUEST: 'bg-amber-100 text-amber-700',
			FOLLOW_ACCEPTED: 'bg-green-100 text-green-700',
			MENTION: 'bg-purple-100 text-purple-600',
			RECIPE_SAVE: 'bg-primary-container text-on-primary-container',
		}
		return map[type]
	}

	/**
	 * Determina si la notificación está relacionada con una publicación y por ende admite miniatura gráfica.
	 * @param n Notificación.
	 */
	hasPostThumbnail(n: Notification): boolean {
		return ['LIKE', 'COMMENT', 'MENTION', 'RECIPE_SAVE'].includes(n.type) && !!n.targetId
	}

	/**
	 * Devuelve los parámetros del routerLink para navegar al elemento origen de la notificación.
	 * @param n Notificación.
	 */
	targetLink(n: Notification): string[] | null {
		if (n.type === 'FOLLOW' || n.type === 'FOLLOW_REQUEST' || n.type === 'FOLLOW_ACCEPTED')
			return n.actor?.username ? ['/profile', n.actor.username] : null
		if (!n.targetId) return null
		return ['/post', n.targetId]
	}

	/**
	 * Navega al perfil de usuario del actor que originó la acción.
	 * @param n Notificación.
	 */
	goToProfile(n: Notification): void {
		if (n.actor?.username) {
			this.router.navigate(['/profile', n.actor.username])
		}
	}

	/**
	 * Acepta o rechaza una solicitud de seguimiento asíncrona.
	 * @param n Notificación de tipo solicitud de seguimiento.
	 * @param accept True para aceptar, false para declinar.
	 */
	respondRequest(n: Notification, accept: boolean): void {
		const actorId = n.actor?.id ?? n.actorId
		if (!actorId || this.loadingRequests()[n.id]) return

		this.loadingRequests.update(m => ({ ...m, [n.id]: true }))

		this.userService.respondFollowRequest(actorId, accept).subscribe({
			next: () => {
				this.requestResponses.update(m => ({ ...m, [n.id]: accept ? 'accepted' : 'rejected' }))
				this.store.markRead(n)
			},
			error: () => {
				this.loadingRequests.update(m => ({ ...m, [n.id]: false }))
			},
			complete: () => {
				this.loadingRequests.update(m => ({ ...m, [n.id]: false }))
			},
		})
	}

	/**
	 * Envía una solicitud de seguimiento directo al actor que originó la notificación.
	 * @param n Notificación.
	 */
	followActor(n: Notification): void {
		const actorId = n.actor?.id ?? n.actorId
		if (!actorId || this.loadingFollows()[actorId]) return

		this.loadingFollows.update(m => ({ ...m, [actorId]: true }))

		this.userService.toggleFollow(actorId, false).subscribe({
			next: res => {
				if (res.following || res.requested) {
					const state = res.following ? 'following' : 'requested'
					this.followStates.update(m => ({ ...m, [actorId]: state }))
				}
			},
			error: () => {
				this.loadingFollows.update(m => ({ ...m, [actorId]: false }))
			},
			complete: () => {
				this.loadingFollows.update(m => ({ ...m, [actorId]: false }))
			},
		})
	}

	/**
	 * Recupera el estado de resolución de una solicitud de seguimiento en la sesión actual.
	 * @param notificationId Identificador de la notificación.
	 */
	getRequestResponse(notificationId: string): 'accepted' | 'rejected' | null {
		return this.requestResponses()[notificationId] ?? null
	}

	/**
	 * Recupera el estado del seguimiento bidireccional respecto al actor de la notificación.
	 * @param n Notificación.
	 */
	getFollowState(n: Notification): 'following' | 'requested' | null {
		const actorId = n.actor?.id ?? n.actorId
		if (!actorId) return null
		return this.followStates()[actorId] ?? null
	}

	/**
	 * Indica si se está respondiendo la solicitud de seguimiento actual en segundo plano.
	 * @param notificationId Identificador de la notificación.
	 */
	isLoadingRequest(notificationId: string): boolean {
		return !!this.loadingRequests()[notificationId]
	}

	/**
	 * Indica si se está ejecutando la acción de seguir al actor de la notificación actual.
	 * @param n Notificación.
	 */
	isLoadingFollow(n: Notification): boolean {
		const actorId = n.actor?.id ?? n.actorId
		return actorId ? !!this.loadingFollows()[actorId] : false
	}

	/**
	 * Devuelve la clave de traducción correspondiente a la etiqueta del botón de seguimiento según su estado actual.
	 * @param n Notificación.
	 */
	followButtonLabelKey(n: Notification): string {
		const state = this.getFollowState(n)
		if (state === 'following') return 'notifications.state.following'
		if (state === 'requested') return 'notifications.state.requested'
		return 'notifications.state.follow'
	}

	/**
	 * Agrupa las notificaciones cronológicamente bajo etiquetas descriptivas (hoy, ayer, esta semana, antiguas).
	 * @param notifications Colección de notificaciones.
	 */
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
		if (today.length) groups.push({ label: 'notifications.date.today', notifications: today })
		if (yesterday.length) groups.push({ label: 'notifications.date.yesterday', notifications: yesterday })
		if (thisWeek.length) groups.push({ label: 'notifications.date.this_week', notifications: thisWeek })
		if (older.length) groups.push({ label: 'notifications.date.older', notifications: older })
		return groups
	}
}
