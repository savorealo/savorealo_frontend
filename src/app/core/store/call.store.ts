import { computed, inject, Injectable, signal } from '@angular/core'
import { RealtimeChannel } from '@supabase/supabase-js'
import { SupabaseService } from '@core/services/supabase.service'
import { AuthStore } from '@core/store/auth.store'
import { CallService } from '@core/services/call.service'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'active'

export interface CallState {
	status: CallStatus
	conversationId: string | null
	remoteUserId: string | null
	remoteName: string
	remoteAvatar: string
	isVideo: boolean
	durationSeconds: number
}

export interface CallSignalPayload {
	type: 'offer' | 'answer' | 'ice-candidate' | 'hangup' | 'reject'
	from: string
	to: string
	sdp?: RTCSessionDescriptionInit
	candidate?: RTCIceCandidateInit
	remoteName?: string
	remoteAvatar?: string
	isVideo?: boolean
}

const IDLE: CallState = {
	status: 'idle',
	conversationId: null,
	remoteUserId: null,
	remoteName: '',
	remoteAvatar: '',
	isVideo: false,
	durationSeconds: 0,
}

// ─── Store ────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CallStore {
	private readonly supabase   = inject(SupabaseService)
	private readonly auth       = inject(AuthStore)
	private readonly callSvc    = inject(CallService)

	// ── State ──────────────────────────────────────────────────────────────

	private readonly _call = signal<CallState>(IDLE)
	readonly call          = this._call.asReadonly()

	readonly isInCall  = computed(() => this._call().status !== 'idle')
	readonly isCalling = computed(() => this._call().status === 'calling')
	readonly isIncoming = computed(() => this._call().status === 'incoming')
	readonly isActive  = computed(() => this._call().status === 'active')

	readonly isMuted     = signal(false)
	readonly isCameraOff = signal(false)

	// Expose streams from CallService directly
	readonly localStream  = this.callSvc.localStream
	readonly remoteStream = this.callSvc.remoteStream

	// ── Internals ──────────────────────────────────────────────────────────

	private readonly channels   = new Map<string, RealtimeChannel>()
	private pendingOffer: RTCSessionDescriptionInit | null = null
	private timer: ReturnType<typeof setInterval> | null = null

	// ── Subscription management ────────────────────────────────────────────

	/**
	 * Call once per conversation when the messages page loads.
	 * Keeps a Realtime broadcast channel open for incoming call signals.
	 */
	subscribeForConversation(conversationId: string): void {
		if (this.channels.has(conversationId)) return
		const myId = this.auth.currentUserId()
		if (!myId) return

		const ch = this.supabase.client
			.channel(`call-room:${conversationId}`)
			.on('broadcast', { event: 'call-signal' }, ({ payload }: { payload: CallSignalPayload }) => {
				if (payload.to !== myId) return
				this.handleSignal(conversationId, payload)
			})
			.subscribe()

		this.channels.set(conversationId, ch)
	}

	unsubscribeAll(): void {
		this.channels.forEach(ch => ch.unsubscribe())
		this.channels.clear()
	}

	// ── Initiate ──────────────────────────────────────────────────────────

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

		// Ensure we're subscribed to signal channel before sending
		this.subscribeForConversation(conversationId)

		try {
			const stream = await this.callSvc.getLocalStream(isVideo)

			this.callSvc.createPeerConnection(candidate =>
				this.sendSignal(conversationId, { type: 'ice-candidate', from: myId, to: receiverId, candidate }),
			)
			this.callSvc.addLocalTracks(stream)

			this._call.set({ status: 'calling', conversationId, remoteUserId: receiverId, remoteName: receiverName, remoteAvatar: receiverAvatar, isVideo, durationSeconds: 0 })

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

	// ── Accept / Reject ────────────────────────────────────────────────────

	async acceptCall(): Promise<void> {
		const state = this._call()
		if (state.status !== 'incoming' || !state.conversationId || !state.remoteUserId || !this.pendingOffer) return

		const myId = this.auth.currentUserId()
		if (!myId) return

		try {
			const stream = await this.callSvc.getLocalStream(state.isVideo)

			this.callSvc.createPeerConnection(candidate =>
				this.sendSignal(state.conversationId!, { type: 'ice-candidate', from: myId, to: state.remoteUserId!, candidate }),
			)
			this.callSvc.addLocalTracks(stream)

			const answer = await this.callSvc.createAnswer(this.pendingOffer)
			this.pendingOffer = null

			this.sendSignal(state.conversationId, { type: 'answer', from: myId, to: state.remoteUserId, sdp: answer })

			this._call.update(c => ({ ...c, status: 'active' }))
			this.startTimer()
		} catch (err) {
			console.error('[CallStore] acceptCall error:', err)
			this.rejectCall()
		}
	}

	rejectCall(): void {
		const state = this._call()
		if (state.status !== 'incoming') return
		const myId = this.auth.currentUserId()
		if (myId && state.conversationId && state.remoteUserId) {
			this.sendSignal(state.conversationId, { type: 'reject', from: myId, to: state.remoteUserId })
		}
		this.callSvc.cleanup()
		this.pendingOffer = null
		this._call.set(IDLE)
	}

	// ── Hang up / Cancel ────────────────────────────────────────────────────

	hangUp(): void {
		const state = this._call()
		if (state.status === 'idle') return
		const myId = this.auth.currentUserId()
		if (myId && state.conversationId && state.remoteUserId) {
			this.sendSignal(state.conversationId, { type: 'hangup', from: myId, to: state.remoteUserId })
		}
		this.endCall()
	}

	// ── Controls ───────────────────────────────────────────────────────────

	toggleMute(): void    { this.isMuted.set(this.callSvc.toggleMute()) }
	toggleCamera(): void  { this.isCameraOff.set(this.callSvc.toggleCamera()) }

	// ── Signal handling ────────────────────────────────────────────────────

	private handleSignal(conversationId: string, payload: CallSignalPayload): void {
		const state = this._call()

		switch (payload.type) {
			case 'offer':
				if (state.status !== 'idle') {
					// Already in a call — auto-reject
					const myId = this.auth.currentUserId()
					if (myId) this.sendSignal(conversationId, { type: 'reject', from: myId, to: payload.from })
					return
				}
				this.pendingOffer = payload.sdp ?? null
				this._call.set({
					status: 'incoming',
					conversationId,
					remoteUserId: payload.from,
					remoteName: payload.remoteName ?? 'Usuario',
					remoteAvatar: payload.remoteAvatar ?? '',
					isVideo: payload.isVideo ?? false,
					durationSeconds: 0,
				})
				break

			case 'answer':
				if (state.status !== 'calling') return
				if (payload.sdp) {
					this.callSvc.setRemoteAnswer(payload.sdp)
					this._call.update(c => ({ ...c, status: 'active' }))
					this.startTimer()
				}
				break

			case 'ice-candidate':
				if (payload.candidate) this.callSvc.addIceCandidate(payload.candidate)
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

	private sendSignal(conversationId: string, payload: CallSignalPayload): void {
		let ch = this.channels.get(conversationId)

		if (!ch) {
			// Lazily subscribe if not already (e.g. caller's own conversation)
			const myId = this.auth.currentUserId()!
			ch = this.supabase.client
				.channel(`call-room:${conversationId}`)
				.on('broadcast', { event: 'call-signal' }, ({ payload: p }: { payload: CallSignalPayload }) => {
					if (p.to !== myId) return
					this.handleSignal(conversationId, p)
				})
				.subscribe()
			this.channels.set(conversationId, ch)
		}

		ch.send({ type: 'broadcast', event: 'call-signal', payload })
	}

	// ── Timer ──────────────────────────────────────────────────────────────

	private startTimer(): void {
		this.stopTimer()
		this.timer = setInterval(() => this._call.update(c => ({ ...c, durationSeconds: c.durationSeconds + 1 })), 1000)
	}

	private stopTimer(): void {
		if (this.timer) { clearInterval(this.timer); this.timer = null }
	}

	private endCall(): void {
		this.stopTimer()
		this.callSvc.cleanup()
		this._call.set(IDLE)
		this.isMuted.set(false)
		this.isCameraOff.set(false)
		this.pendingOffer = null
	}
}
