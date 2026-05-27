import { computed, inject, Injectable, signal } from '@angular/core'
import { RealtimeChannel } from '@supabase/supabase-js'
import { SupabaseService } from '@core/services/supabase.service'
import { AuthStore } from '@core/store/auth.store'
import { CallService } from '@core/services/call.service'

/**
 * Tipo de dato personalizado para callstatus.
 */
export type CallStatus = 'idle' | 'calling' | 'incoming' | 'active'

/**
 * Interfaz que define la estructura o contrato de datos para callstate.
 */
export interface CallState {
	/**
	 * Propiedad para gestionar status.
	 */
	status: CallStatus
	/**
	 * Propiedad para gestionar conversation identificador.
	 */
	conversationId: string | null
	/**
	 * Propiedad para gestionar remote user identificador.
	 */
	remoteUserId: string | null
	/**
	 * Propiedad para gestionar remote nombre.
	 */
	remoteName: string
	/**
	 * Propiedad para gestionar remote avatar.
	 */
	remoteAvatar: string
	/**
	 * Indicador booleano para es o está video.
	 */
	isVideo: boolean
	/**
	 * Propiedad para gestionar duración seconds.
	 */
	durationSeconds: number
}

/**
 * Interfaz que define la estructura o contrato de datos para callsignalpayload.
 */
export interface CallSignalPayload {
	/**
	 * Propiedad para gestionar type.
	 */
	type: 'offer' | 'answer' | 'ice-candidate' | 'hangup' | 'reject'
	/**
	 * Propiedad para gestionar from.
	 */
	from: string
	/**
	 * Propiedad para gestionar to.
	 */
	to: string
	/**
	 * Propiedad para gestionar conversation identificador.
	 */
	conversationId?: string
	/**
	 * Propiedad para gestionar sdp.
	 */
	sdp?: RTCSessionDescriptionInit
	/**
	 * Indicador booleano para candidate.
	 */
	candidate?: RTCIceCandidateInit
	/**
	 * Propiedad para gestionar remote nombre.
	 */
	remoteName?: string
	/**
	 * Propiedad para gestionar remote avatar.
	 */
	remoteAvatar?: string
	/**
	 * Indicador booleano para es o está video.
	 */
	isVideo?: boolean
}

/**
 * Interfaz que representa la estructura de dle.
 */
const IDLE: CallState = {
	status: 'idle',
	conversationId: null,
	remoteUserId: null,
	remoteName: '',
	remoteAvatar: '',
	isVideo: false,
	durationSeconds: 0,
}

/**
 * Almacén de estado reactivo para gestionar la lógica de las llamadas de voz/video.
 */
@Injectable({ providedIn: 'root' })
export class CallStore {
	/**
	 * Propiedad para gestionar supabase.
	 */
	private readonly supabase   = inject(SupabaseService)
	/**
	 * Propiedad para gestionar auth.
	 */
	private readonly auth       = inject(AuthStore)
	/**
	 * Propiedad para gestionar call svc.
	 */
	private readonly callSvc    = inject(CallService)

	/**
	 * Propiedad para gestionar call.
	 */
	private readonly _call = signal<CallState>(IDLE)
	/**
	 * Propiedad para gestionar call.
	 */
	readonly call          = this._call.asReadonly()

	/**
	 * Indicador booleano para es o está en call.
	 */
	readonly isInCall  = computed(() => this._call().status !== 'idle')
	/**
	 * Indicador booleano para es o está calling.
	 */
	readonly isCalling = computed(() => this._call().status === 'calling')
	/**
	 * Indicador booleano para es o está incoming.
	 */
	readonly isIncoming = computed(() => this._call().status === 'incoming')
	/**
	 * Indicador booleano para es o está active.
	 */
	readonly isActive  = computed(() => this._call().status === 'active')

	/**
	 * Indicador booleano para es o está muted.
	 */
	readonly isMuted     = signal(false)
	/**
	 * Indicador booleano para es o está camera off.
	 */
	readonly isCameraOff = signal(false)

	/**
	 * Propiedad para gestionar local stream.
	 */
	readonly localStream  = this.callSvc.localStream
	/**
	 * Propiedad para gestionar remote stream.
	 */
	readonly remoteStream = this.callSvc.remoteStream

	/**
	 * Propiedad para gestionar channels.
	 */
	private readonly channels   = new Map<string, RealtimeChannel>()
	/**
	 * Propiedad para gestionar user channel.
	 */
	private userChannel: RealtimeChannel | null = null
	/**
	 * Propiedad para gestionar subscribed user identificador.
	 */
	private subscribedUserId: string | null = null
	/**
	 * Propiedad para gestionar pending offer.
	 */
	private pendingOffer: RTCSessionDescriptionInit | null = null
	/**
	 * Propiedad para gestionar pending candidates.
	 */
	private pendingCandidates: RTCIceCandidateInit[] = []
	/**
	 * Propiedad para gestionar answer handled.
	 */
	private answerHandled = false
	/**
	 * Propiedad para gestionar timer.
	 */
	private timer: ReturnType<typeof setInterval> | null = null
	/**
	 * Propiedad para gestionar incoming timeout.
	 */
	private incomingTimeout: ReturnType<typeof setTimeout> | null = null

	/**
	 * Método para subscribe for current user.
	 */
	subscribeForCurrentUser(): void {
		const myId = this.auth.currentUserId()
		if (!myId || this.subscribedUserId === myId) return

		this.userChannel?.unsubscribe()
		this.userChannel = this.supabase.client
			.channel(`call-user:${myId}`)
			.on('broadcast', { event: 'call-signal' }, ({ payload: p }: { payload: CallSignalPayload }) => {
				if (p.to !== myId || !p.conversationId) return
				this.handleSignal(p.conversationId, p)
			})
			.subscribe()
		this.subscribedUserId = myId
	}

	/**
	 * Método para subscribe for conversation.
	 */
	subscribeForConversation(conversationId: string): void {
		if (this.channels.has(conversationId)) return
		this.ensureSubscribed(conversationId)
	}

	/**
	 * Método para unsubscribe todos.
	 */
	unsubscribeAll(): void {
		this.channels.forEach(ch => ch.unsubscribe())
		this.channels.clear()
		this.subscriptionReady.clear()
		this.userChannel?.unsubscribe()
		this.userChannel = null
		this.subscribedUserId = null
	}

	/**
	 * Método para initiate call.
	 */
	async initiateCall(
		conversationId: string,
		receiverId: string,
		receiverName: string,
		receiverAvatar: string,
		isVideo: boolean,
	): Promise<void> {
		const myId      = this.auth.currentUserId()
		const myProfile = this.auth.profile()
		if (!myId) return

		this.subscribeForConversation(conversationId)

		try {
			const stream = await this.callSvc.getLocalStream(isVideo)

			await this.ensureSubscribed(conversationId)

			this.callSvc.createPeerConnection(candidate =>
				this.sendSignal(conversationId, { type: 'ice-candidate', from: myId, to: receiverId, candidate }),
			)
			this.callSvc.addLocalTracks(stream)

			this._call.set({ status: 'calling', conversationId, remoteUserId: receiverId, remoteName: receiverName, remoteAvatar: receiverAvatar, isVideo, durationSeconds: 0 })
			this.answerHandled = false

			const offer = await this.callSvc.createOffer()

			this.sendSignal(conversationId, {
				type: 'offer',
				from: myId,
				to: receiverId,
				sdp: offer,
				remoteName: myProfile?.fullName ?? myProfile?.username ?? 'Usuario',
				remoteAvatar: myProfile?.photo_url ?? '',
				isVideo,
			})
		} catch (err) {
			console.error('[CallStore] initiateCall error:', err)
			this.callSvc.cleanup()
			this._call.set(IDLE)
		}
	}

	/**
	 * Método para accept call.
	 */
	async acceptCall(): Promise<void> {
		const state = this._call()
		if (state.status !== 'incoming' || !state.conversationId || !state.remoteUserId || !this.pendingOffer) return

		const myId = this.auth.currentUserId()
		if (!myId) return

		try {
			const stream = await this.callSvc.getLocalStream(state.isVideo)

			await this.ensureSubscribed(state.conversationId)

			this.callSvc.createPeerConnection(candidate =>
				this.sendSignal(state.conversationId!, { type: 'ice-candidate', from: myId, to: state.remoteUserId!, candidate }),
			)
			this.callSvc.addLocalTracks(stream)

			const answer = await this.callSvc.createAnswer(this.pendingOffer)
			this.pendingOffer = null
			await this.flushPendingCandidates()

			this.sendSignal(state.conversationId, { type: 'answer', from: myId, to: state.remoteUserId, sdp: answer })

			this.clearIncomingTimeout()
			this._call.update(c => ({ ...c, status: 'active' }))
			this.startTimer()
		} catch (err) {
			console.error('[CallStore] acceptCall error:', err)
			this.rejectCall()
		}
	}

	/**
	 * Método para reject call.
	 */
	rejectCall(): void {
		const state = this._call()
		if (state.status !== 'incoming') return
		const myId = this.auth.currentUserId()
		if (myId && state.conversationId && state.remoteUserId) {
			this.sendSignal(state.conversationId, { type: 'reject', from: myId, to: state.remoteUserId })
		}
		this.endCall()
	}

	/**
	 * Método para hang up.
	 */
	hangUp(): void {
		const state = this._call()
		if (state.status === 'idle') return
		const myId = this.auth.currentUserId()
		if (myId && state.conversationId && state.remoteUserId) {
			this.sendSignal(state.conversationId, { type: 'hangup', from: myId, to: state.remoteUserId })
		}
		this.endCall()
	}

	/**
	 * Método para alternar mute.
	 */
	toggleMute(): void    { this.isMuted.set(this.callSvc.toggleMute()) }
	/**
	 * Método para alternar camera.
	 */
	toggleCamera(): void  { this.isCameraOff.set(this.callSvc.toggleCamera()) }

	/**
	 * Método para gestionar signal.
	 */
	private handleSignal(conversationId: string, payload: CallSignalPayload): void {
		const state = this._call()

		switch (payload.type) {
			case 'offer':
				if (state.status !== 'idle') {
					const myId = this.auth.currentUserId()
					if (myId) this.sendSignal(conversationId, { type: 'reject', from: myId, to: payload.from })
					return
				}
				this.subscribeForConversation(conversationId)
				this.pendingOffer = payload.sdp ?? null
				this.pendingCandidates = []
				this._call.set({
					status: 'incoming',
					conversationId,
					remoteUserId: payload.from,
					remoteName: payload.remoteName ?? 'Usuario',
					remoteAvatar: payload.remoteAvatar ?? '',
					isVideo: payload.isVideo ?? false,
					durationSeconds: 0,
				})
				this.startIncomingTimeout()
				break

			case 'answer':
				if (state.status !== 'calling') return
				if (this.answerHandled) return
				if (payload.sdp) {
					this.answerHandled = true
					this.callSvc.setRemoteAnswer(payload.sdp).then(() => {
						this.flushPendingCandidates()
						this._call.update(c => ({ ...c, status: 'active' }))
						this.startTimer()
					}).catch(err => {
						console.error('[CallStore] answer error:', err)
						this.answerHandled = false
					})
				}
				break

			case 'ice-candidate':
				if (payload.candidate) {
					this.callSvc.addIceCandidate(payload.candidate).catch(() => {
						this.pendingCandidates.push(payload.candidate!)
					})
				}
				break

			case 'hangup':
				this.endCall()
				break

			case 'reject':
				this.callSvc.cleanup()
				this._call.set(IDLE)
				break
		}
	}

	/**
	 * Propiedad para gestionar subscription ready.
	 */
	private subscriptionReady = new Map<string, Promise<void>>()

	/**
	 * Método para ensure subscribed.
	 */
	private ensureSubscribed(conversationId: string): Promise<void> {
		const existing = this.subscriptionReady.get(conversationId)
		if (existing) return existing

		const myId = this.auth.currentUserId()
		if (!myId) return Promise.resolve()

		const ready = new Promise<void>((resolve) => {
			const ch = this.supabase.client
				.channel(`call-room:${conversationId}`)
				.on('broadcast', { event: 'call-signal' }, ({ payload: p }: { payload: CallSignalPayload }) => {
					if (p.to !== myId) return
					this.handleSignal(conversationId, p)
				})
				.subscribe((status) => {
					if (status === 'SUBSCRIBED') resolve()
				})
			this.channels.set(conversationId, ch)
		})

		this.subscriptionReady.set(conversationId, ready)
		return ready
	}

	/**
	 * Método para enviar signal.
	 */
	private async sendSignal(conversationId: string, payload: CallSignalPayload): Promise<void> {
		await this.ensureSubscribed(conversationId)
		const enriched = { ...payload, conversationId }

		if (payload.type === 'offer') {
			await this.sendToUserChannel(payload.to, enriched)
			return
		}

		const ch = this.channels.get(conversationId)
		if (ch) await ch.send({ type: 'broadcast', event: 'call-signal', payload: enriched })

		if (payload.type === 'answer' || payload.type === 'hangup' || payload.type === 'reject') {
			await this.sendToUserChannel(payload.to, enriched)
		}
	}

	/**
	 * Método para enviar to user channel.
	 */
	private async sendToUserChannel(userId: string, payload: CallSignalPayload): Promise<void> {
		const userChannel = this.supabase.client.channel(`call-user:${userId}`)
		await new Promise<void>(resolve => {
			userChannel.subscribe(status => {
				if (status !== 'SUBSCRIBED') return
				userChannel
					.send({ type: 'broadcast', event: 'call-signal', payload })
					.finally(() => {
						userChannel.unsubscribe()
						resolve()
					})
			})
		})
	}

	/**
	 * Método para start timer.
	 */
	private startTimer(): void {
		this.stopTimer()
		this.timer = setInterval(() => this._call.update(c => ({ ...c, durationSeconds: c.durationSeconds + 1 })), 1000)
	}

	/**
	 * Método para stop timer.
	 */
	private stopTimer(): void {
		if (this.timer) { clearInterval(this.timer); this.timer = null }
	}

	/**
	 * Método para start incoming timeout.
	 */
	private startIncomingTimeout(): void {
		this.clearIncomingTimeout()
		this.incomingTimeout = setTimeout(() => {
			if (this._call().status === 'incoming') this.rejectCall()
		}, 30000)
	}

	/**
	 * Método para limpiar incoming timeout.
	 */
	private clearIncomingTimeout(): void {
		if (this.incomingTimeout) {
			clearTimeout(this.incomingTimeout)
			this.incomingTimeout = null
		}
	}

	/**
	 * Método para flush pending candidates.
	 */
	private async flushPendingCandidates(): Promise<void> {
		const candidates = [...this.pendingCandidates]
		this.pendingCandidates = []
		await Promise.all(candidates.map(candidate => this.callSvc.addIceCandidate(candidate).catch(() => undefined)))
	}

	/**
	 * Método para end call.
	 */
	private endCall(): void {
		this.stopTimer()
		this.clearIncomingTimeout()
		this.callSvc.cleanup()
		this._call.set(IDLE)
		this.isMuted.set(false)
		this.isCameraOff.set(false)
		this.pendingOffer = null
		this.pendingCandidates = []
		this.answerHandled = false
	}
}
