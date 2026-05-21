import { computed, inject, Injectable, signal } from '@angular/core'
import { RealtimeChannel } from '@supabase/supabase-js'
import { SupabaseService } from '@core/services/supabase.service'
import { AuthStore } from '@core/store/auth.store'
import { CallService } from '@core/services/call.service'

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
	conversationId?: string
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

@Injectable({ providedIn: 'root' })
export class CallStore {
	private readonly supabase   = inject(SupabaseService)
	private readonly auth       = inject(AuthStore)
	private readonly callSvc    = inject(CallService)

	private readonly _call = signal<CallState>(IDLE)
	readonly call          = this._call.asReadonly()

	readonly isInCall  = computed(() => this._call().status !== 'idle')
	readonly isCalling = computed(() => this._call().status === 'calling')
	readonly isIncoming = computed(() => this._call().status === 'incoming')
	readonly isActive  = computed(() => this._call().status === 'active')

	readonly isMuted     = signal(false)
	readonly isCameraOff = signal(false)

	readonly localStream  = this.callSvc.localStream
	readonly remoteStream = this.callSvc.remoteStream

	private readonly channels   = new Map<string, RealtimeChannel>()
	private userChannel: RealtimeChannel | null = null
	private subscribedUserId: string | null = null
	private pendingOffer: RTCSessionDescriptionInit | null = null
	private pendingCandidates: RTCIceCandidateInit[] = []
	private answerHandled = false
	private timer: ReturnType<typeof setInterval> | null = null
	private incomingTimeout: ReturnType<typeof setTimeout> | null = null

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

	subscribeForConversation(conversationId: string): void {
		if (this.channels.has(conversationId)) return
		this.ensureSubscribed(conversationId)
	}

	unsubscribeAll(): void {
		this.channels.forEach(ch => ch.unsubscribe())
		this.channels.clear()
		this.subscriptionReady.clear()
		this.userChannel?.unsubscribe()
		this.userChannel = null
		this.subscribedUserId = null
	}

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

	rejectCall(): void {
		const state = this._call()
		if (state.status !== 'incoming') return
		const myId = this.auth.currentUserId()
		if (myId && state.conversationId && state.remoteUserId) {
			this.sendSignal(state.conversationId, { type: 'reject', from: myId, to: state.remoteUserId })
		}
		this.endCall()
	}

	hangUp(): void {
		const state = this._call()
		if (state.status === 'idle') return
		const myId = this.auth.currentUserId()
		if (myId && state.conversationId && state.remoteUserId) {
			this.sendSignal(state.conversationId, { type: 'hangup', from: myId, to: state.remoteUserId })
		}
		this.endCall()
	}

	toggleMute(): void    { this.isMuted.set(this.callSvc.toggleMute()) }
	toggleCamera(): void  { this.isCameraOff.set(this.callSvc.toggleCamera()) }

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

	private subscriptionReady = new Map<string, Promise<void>>()

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

	private startTimer(): void {
		this.stopTimer()
		this.timer = setInterval(() => this._call.update(c => ({ ...c, durationSeconds: c.durationSeconds + 1 })), 1000)
	}

	private stopTimer(): void {
		if (this.timer) { clearInterval(this.timer); this.timer = null }
	}

	private startIncomingTimeout(): void {
		this.clearIncomingTimeout()
		this.incomingTimeout = setTimeout(() => {
			if (this._call().status === 'incoming') this.rejectCall()
		}, 30000)
	}

	private clearIncomingTimeout(): void {
		if (this.incomingTimeout) {
			clearTimeout(this.incomingTimeout)
			this.incomingTimeout = null
		}
	}

	private async flushPendingCandidates(): Promise<void> {
		const candidates = [...this.pendingCandidates]
		this.pendingCandidates = []
		await Promise.all(candidates.map(candidate => this.callSvc.addIceCandidate(candidate).catch(() => undefined)))
	}

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
