import { Injectable, signal } from '@angular/core'

/**
 * Servicio que provee la lógica de negocio para las llamadas de voz/video.
 */
@Injectable({ providedIn: 'root' })
export class CallService {
	/**
	 * Propiedad para gestionar local stream.
	 */
	readonly localStream  = signal<MediaStream | null>(null)
	/**
	 * Propiedad para gestionar remote stream.
	 */
	readonly remoteStream = signal<MediaStream | null>(null)

	/**
	 * Propiedad para gestionar pc.
	 */
	private pc: RTCPeerConnection | null = null

	/**
	 * Propiedad para gestionar rtc config.
	 */
	private readonly rtcConfig: RTCConfiguration = {
		iceServers: [
			{ urls: 'stun:stun.l.google.com:19302' },
			{ urls: 'stun:stun1.l.google.com:19302' },
			{
				urls: [
					'turn:openrelay.metered.ca:80',
					'turn:openrelay.metered.ca:443',
					'turn:openrelay.metered.ca:443?transport=tcp',
				],
				username: 'openrelayproject',
				credential: 'openrelayproject',
			},
		],
		iceCandidatePoolSize: 10,
	}

	/**
	 * Método para obtener local stream.
	 */
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

	/**
	 * Método para crear peer connection.
	 */
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

	/**
	 * Método para añadir local tracks.
	 */
	addLocalTracks(stream: MediaStream): void {
		if (!this.pc) return
		stream.getTracks().forEach(track => this.pc!.addTrack(track, stream))
	}

	/**
	 * Método para crear offer.
	 */
	async createOffer(): Promise<RTCSessionDescriptionInit> {
		if (!this.pc) throw new Error('No peer connection')
		const offer = await this.pc.createOffer()
		await this.pc.setLocalDescription(offer)
		return offer
	}

	/**
	 * Método para crear answer.
	 */
	async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
		if (!this.pc) throw new Error('No peer connection')
		await this.pc.setRemoteDescription(new RTCSessionDescription(offer))
		const answer = await this.pc.createAnswer()
		await this.pc.setLocalDescription(answer)
		return answer
	}

	/**
	 * Método para establecer remote answer.
	 */
	async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
		if (!this.pc) return
		await this.pc.setRemoteDescription(new RTCSessionDescription(answer))
	}

	/**
	 * Método para añadir ice candidate.
	 */
	async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
		if (!this.pc || !this.pc.remoteDescription) throw new Error('Remote description not ready')
		try {
			await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
		} catch {}
	}

	/**
	 * Método para alternar mute.
	 */
	toggleMute(): boolean {
		const track = this.localStream()?.getAudioTracks()[0]
		if (!track) return false
		track.enabled = !track.enabled
		return !track.enabled
	}

	/**
	 * Método para alternar camera.
	 */
	toggleCamera(): boolean {
		const track = this.localStream()?.getVideoTracks()[0]
		if (!track) return false
		track.enabled = !track.enabled
		return !track.enabled
	}

	/**
	 * Método para cleanup.
	 */
	cleanup(): void {
		this.localStream()?.getTracks().forEach(t => t.stop())
		this.localStream.set(null)
		this.remoteStream.set(null)
		this.pc?.close()
		this.pc = null
	}
}
