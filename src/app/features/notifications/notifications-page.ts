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

interface Tab {
	key: NotificationTab
	label: string
	count: number
}

@Component({
	selector: 'app-notifications-page',
	imports: [AppShell, Avatar, RouterLink, TimeAgoPipe, SavoLoader],
	templateUrl: './notifications-page.html',
})
export class NotificationsPage implements OnInit {
	readonly store = inject(NotificationsStore)
	private readonly userService = inject(UserService)
	private readonly supabase = inject(SupabaseService)
	private readonly authStore = inject(AuthStore)
	private readonly router = inject(Router)

	readonly requestResponses = signal<Record<string, 'accepted' | 'rejected'>>({})
	readonly followStates = signal<Record<string, 'following' | 'requested'>>({})
	readonly loadingRequests = signal<Record<string, boolean>>({})
	readonly loadingFollows = signal<Record<string, boolean>>({})

	readonly tabs = computed<Tab[]>(() => [
		{ key: 'all', label: 'Todas', count: this.store.notifications().length },
		{ key: 'unread', label: 'No leídas', count: this.store.unreadCount() },
		{ key: 'mentions', label: 'Menciones', count: this.store.mentionsCount() },
		{ key: 'social', label: 'Sociales', count: this.store.socialCount() },
	])

	readonly groups = computed<NotificationGroup[]>(() =>
		this.groupByDate(this.store.filteredNotifications()),
	)

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

	ngOnInit(): void {
		this.store.load()
	}

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

	actorName(n: Notification): string {
		return n.actor?.fullName || n.actor?.username || 'Alguien'
	}

	notificationText(n: Notification): string {
		const map: Record<NotificationType, string> = {
			LIKE: 'le ha gustado tu receta',
			COMMENT: 'ha comentado',
			FOLLOW: 'ha empezado a seguirte',
			FOLLOW_REQUEST: 'quiere seguirte',
			FOLLOW_ACCEPTED: 'aceptó tu solicitud de seguimiento',
			MENTION: 'te ha mencionado en un comentario',
			RECIPE_SAVE: 'ha guardado tu receta',
		}
		return n.content ?? map[n.type] ?? 'interactuó con tu contenido'
	}

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

	chipLabel(type: NotificationType): string {
		const map: Record<NotificationType, string> = {
			LIKE: 'Me gusta',
			COMMENT: 'Comentario',
			FOLLOW: 'Nuevo seguidor',
			FOLLOW_REQUEST: 'Solicitud',
			FOLLOW_ACCEPTED: 'Aceptada',
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
			FOLLOW_REQUEST: 'bg-amber-100 text-amber-700',
			FOLLOW_ACCEPTED: 'bg-green-100 text-green-700',
			MENTION: 'bg-purple-100 text-purple-600',
			RECIPE_SAVE: 'bg-primary-container text-on-primary-container',
		}
		return map[type]
	}

	hasPostThumbnail(n: Notification): boolean {
		return ['LIKE', 'COMMENT', 'MENTION', 'RECIPE_SAVE'].includes(n.type) && !!n.targetId
	}

	targetLink(n: Notification): string[] | null {
		if (n.type === 'FOLLOW' || n.type === 'FOLLOW_REQUEST' || n.type === 'FOLLOW_ACCEPTED')
			return n.actor?.username ? ['/profile', n.actor.username] : null
		if (!n.targetId) return null
		return ['/post', n.targetId]
	}

	goToProfile(n: Notification): void {
		if (n.actor?.username) {
			this.router.navigate(['/profile', n.actor.username])
		}
	}

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

	getRequestResponse(notificationId: string): 'accepted' | 'rejected' | null {
		return this.requestResponses()[notificationId] ?? null
	}

	getFollowState(n: Notification): 'following' | 'requested' | null {
		const actorId = n.actor?.id ?? n.actorId
		if (!actorId) return null
		return this.followStates()[actorId] ?? null
	}

	isLoadingRequest(notificationId: string): boolean {
		return !!this.loadingRequests()[notificationId]
	}

	isLoadingFollow(n: Notification): boolean {
		const actorId = n.actor?.id ?? n.actorId
		return actorId ? !!this.loadingFollows()[actorId] : false
	}

	followButtonLabel(n: Notification): string {
		const state = this.getFollowState(n)
		if (state === 'following') return 'Siguiendo'
		if (state === 'requested') return 'Solicitado'
		return 'Seguir'
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
