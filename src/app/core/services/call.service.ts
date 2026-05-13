import { Injectable, signal } from '@angular/core'

/**
 * Pure WebRTC service — manages the peer connection, media streams and
 * codec negotiation. All signalling is handled by CallStore.
 */
@Injectable({ providedIn: 'root' })
export class CallService {
	readonly localStream  = signal<MediaStream | null>(null)
	readonly remoteStream = signal<MediaStream | null>(null)

	private pc: RTCPeerConnection | null = null

	private readonly rtcConfig: RTCConfiguration = {
		iceServers: [
			{ urls: 'stun:stun.l.google.com:19302' },
			{ urls: 'stun:stun1.l.google.com:19302' },
			{ urls: 'stun:stun2.l.google.com:19302' },
		],
	}

	// ─── Media ───────────────────────────────────────────────────────────────

	async getLocalStream(isVideo: boolean): Promise<MediaStream> {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
			video: isVideo
				? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
				: false,
		})
		this.localStream.set(stream)
		return stream
	}

	// ─── Peer connection ─────────────────────────────────────────────────────

	createPeerConnection(
		onIceCandidate: (candidate: RTCIceCandidateInit) => void,
	): RTCPeerConnection {
		this.pc = new RTCPeerConnection(this.rtcConfig)

		this.pc.onicecandidate = (e) => {
			if (e.candidate) onIceCandidate(e.candidate.toJSON())
		}

		this.pc.ontrack = (e) => {
			if (e.streams[0]) this.remoteStream.set(e.streams[0])
		}

		return this.pc
	}

	addLocalTracks(stream: MediaStream): void {
		if (!this.pc) return
		stream.getTracks().forEach(track => this.pc!.addTrack(track, stream))
	}

	async createOffer(): Promise<RTCSessionDescriptionInit> {
		if (!this.pc) throw new Error('No peer connection')
		const offer = await this.pc.createOffer()
		await this.pc.setLocalDescription(offer)
		return offer
	}

	async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
		if (!this.pc) throw new Error('No peer connection')
		await this.pc.setRemoteDescription(new RTCSessionDescription(offer))
		const answer = await this.pc.createAnswer()
		await this.pc.setLocalDescription(answer)
		return answer
	}

	async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
		if (!this.pc) return
		await this.pc.setRemoteDescription(new RTCSessionDescription(answer))
	}

	async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
		if (!this.pc) return
		try {
			await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
		} catch {
			// ignore stale candidates
		}
	}

	// ─── Controls ────────────────────────────────────────────────────────────

	/** Returns true if now muted */
	toggleMute(): boolean {
		const track = this.localStream()?.getAudioTracks()[0]
		if (!track) return false
		track.enabled = !track.enabled
		return !track.enabled
	}

	/** Returns true if camera is now off */
	toggleCamera(): boolean {
		const track = this.localStream()?.getVideoTracks()[0]
		if (!track) return false
		track.enabled = !track.enabled
		return !track.enabled
	}

	// ─── Cleanup ─────────────────────────────────────────────────────────────

	cleanup(): void {
		this.localStream()?.getTracks().forEach(t => t.stop())
		this.localStream.set(null)
		this.remoteStream.set(null)
		this.pc?.close()
		this.pc = null
	}
}
