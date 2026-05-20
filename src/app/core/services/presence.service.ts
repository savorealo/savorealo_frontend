import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { RealtimeChannel } from '@supabase/supabase-js'
import { SupabaseService } from '@core/services/supabase.service'

interface UserPresenceState {
	userId?: string
	onlineAt?: string
}

@Injectable({ providedIn: 'root' })
export class PresenceService {
	private readonly supabase = inject(SupabaseService)
	private readonly destroyRef = inject(DestroyRef)
	private readonly platformId = inject(PLATFORM_ID)
	private readonly isBrowser = isPlatformBrowser(this.platformId)

	private readonly _onlineUserIds = signal<Set<string>>(new Set<string>())
	private channel: RealtimeChannel | null = null
	private userId: string | null = null
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null

	readonly onlineUserIds = this._onlineUserIds.asReadonly()

	constructor() {
		if (this.isBrowser) {
			window.addEventListener('pagehide', () => this.touchLastSeen())
			document.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'hidden') this.touchLastSeen()
			})
		}

		this.destroyRef.onDestroy(() => this.stop())
	}

	start(userId: string): void {
		if (this.userId === userId && this.channel) return

		this.stop()
		this.userId = userId
		this.touchLastSeen()
		this.heartbeatTimer = setInterval(() => this.touchLastSeen(), 60000)

		const channel = this.supabase.client.channel('online-users', {
			config: { presence: { key: userId } },
		})

		const notify = () => {
			const state = channel.presenceState() as Record<string, UserPresenceState[]>
			this._onlineUserIds.set(new Set(Object.keys(state)))
		}

		this.channel = channel
			.on('presence', { event: 'sync' }, notify)
			.on('presence', { event: 'join' }, notify)
			.on('presence', { event: 'leave' }, notify)
			.subscribe(status => {
				if (status !== 'SUBSCRIBED') return
				void channel.track({ userId, onlineAt: new Date().toISOString() })
				notify()
			})
	}

	stop(): void {
		this.touchLastSeen()
		if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
		this.channel?.unsubscribe()
		this.heartbeatTimer = null
		this.channel = null
		this.userId = null
		this._onlineUserIds.set(new Set<string>())
	}

	private touchLastSeen(): void {
		if (!this.userId) return
		void this.supabase.client
			.from('person_profiles')
			.update({ last_seen_at: new Date().toISOString() })
			.eq('user_id', this.userId)
	}
}
