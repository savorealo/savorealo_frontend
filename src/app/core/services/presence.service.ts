import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { RealtimeChannel } from '@supabase/supabase-js'
import { SupabaseService } from '@core/services/supabase.service'

/**
 * Interfaz que define la estructura o contrato de datos para userpresencestate.
 */
interface UserPresenceState {
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId?: string
	/**
	 * Propiedad para gestionar online at.
	 */
	onlineAt?: string
}

/**
 * Servicio que provee la lógica de negocio para la presencia en línea de los usuarios.
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
	/**
	 * Propiedad para gestionar supabase.
	 */
	private readonly supabase = inject(SupabaseService)
	/**
	 * Propiedad para gestionar destroy ref.
	 */
	private readonly destroyRef = inject(DestroyRef)
	/**
	 * Propiedad para gestionar platform identificador.
	 */
	private readonly platformId = inject(PLATFORM_ID)
	/**
	 * Indicador booleano para es o está browser.
	 */
	private readonly isBrowser = isPlatformBrowser(this.platformId)

	/**
	 * Propiedad para gestionar online user ids.
	 */
	private readonly _onlineUserIds = signal<Set<string>>(new Set<string>())
	/**
	 * Propiedad para gestionar channel.
	 */
	private channel: RealtimeChannel | null = null
	/**
	 * Propiedad para gestionar user identificador.
	 */
	private userId: string | null = null
	/**
	 * Propiedad para gestionar heartbeat timer.
	 */
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null

	/**
	 * Propiedad para gestionar online user ids.
	 */
	readonly onlineUserIds = this._onlineUserIds.asReadonly()

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
	constructor() {
		if (this.isBrowser) {
			window.addEventListener('pagehide', () => this.touchLastSeen())
			document.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'hidden') this.touchLastSeen()
			})
		}

		this.destroyRef.onDestroy(() => this.stop())
	}

	/**
	 * Método para start.
	 */
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

	/**
	 * Método para stop.
	 */
	stop(): void {
		this.touchLastSeen()
		if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
		this.channel?.unsubscribe()
		this.heartbeatTimer = null
		this.channel = null
		this.userId = null
		this._onlineUserIds.set(new Set<string>())
	}

	/**
	 * Método para touch last seen.
	 */
	private touchLastSeen(): void {
		if (!this.userId) return
		void this.supabase.client
			.from('person_profiles')
			.update({ last_seen_at: new Date().toISOString() })
			.eq('user_id', this.userId)
	}
}
