import { Component, computed, effect, inject, viewChild, ElementRef } from '@angular/core'
import { CallStore } from '@core/store/call.store'

/**
 * Clase de utilidad para calloverlay.
 */
@Component({
	selector: 'app-call-overlay',
	templateUrl: './call-overlay.html',
})
export class CallOverlay {
	/**
	 * Propiedad para gestionar store.
	 */
	readonly store = inject(CallStore)
	/**
	 * Propiedad para gestionar call.
	 */
	readonly call  = this.store.call

	/**
	 * Propiedad para gestionar remote video el.
	 */
	private readonly remoteVideoEl = viewChild<ElementRef<HTMLVideoElement>>('remoteVideo')
	/**
	 * Propiedad para gestionar remote audio el.
	 */
	private readonly remoteAudioEl = viewChild<ElementRef<HTMLAudioElement>>('remoteAudio')
	/**
	 * Propiedad para gestionar local video el.
	 */
	private readonly localVideoEl  = viewChild<ElementRef<HTMLVideoElement>>('localVideo')

	/**
	 * Propiedad para gestionar formatted duración.
	 */
	readonly formattedDuration = computed(() => {
		const s = this.call().durationSeconds
		const mm = Math.floor(s / 60).toString().padStart(2, '0')
		const ss = (s % 60).toString().padStart(2, '0')
		return `${mm}:${ss}`
	})

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
	constructor() {
		effect(() => {
			this.attachStream(this.remoteVideoEl(), this.store.remoteStream())
		})
		effect(() => {
			this.attachStream(this.remoteAudioEl(), this.store.remoteStream())
		})
		effect(() => {
			this.attachStream(this.localVideoEl(), this.store.localStream())
		})
	}

	/**
	 * Método para attach stream.
	 */
	private attachStream(ref: ElementRef<HTMLMediaElement> | undefined, stream: MediaStream | null): void {
		const el = ref?.nativeElement
		if (!el || !stream || el.srcObject === stream) return

		el.srcObject = stream
		void el.play().catch(() => undefined)
	}
}
