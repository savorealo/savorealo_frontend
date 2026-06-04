import { Component, computed, effect, inject, viewChild, ElementRef } from '@angular/core'
import { CallStore } from '@core/store/call.store'

@Component({
	selector: 'app-call-overlay',
	templateUrl: './call-overlay.html',
})
export class CallOverlay {
	readonly store = inject(CallStore)
	readonly call  = this.store.call

	private readonly remoteVideoEl = viewChild<ElementRef<HTMLVideoElement>>('remoteVideo')
	private readonly remoteAudioEl = viewChild<ElementRef<HTMLAudioElement>>('remoteAudio')
	private readonly localVideoEl  = viewChild<ElementRef<HTMLVideoElement>>('localVideo')

	readonly iceFailed = this.store.iceFailed

	readonly formattedDuration = computed(() => {
		const s  = this.call().durationSeconds
		const mm = Math.floor(s / 60).toString().padStart(2, '0')
		const ss = (s % 60).toString().padStart(2, '0')
		return `${mm}:${ss}`
	})

	constructor() {
		effect(() => { this.attachStream(this.remoteVideoEl(), this.store.remoteStream()) })
		effect(() => { this.attachStream(this.remoteAudioEl(), this.store.remoteStream()) })
		effect(() => { this.attachStream(this.localVideoEl(),  this.store.localStream())  })
	}

	private attachStream(ref: ElementRef<HTMLMediaElement> | undefined, stream: MediaStream | null): void {
		const el = ref?.nativeElement
		if (!el || !stream || el.srcObject === stream) return
		el.srcObject = stream
		void el.play().catch(() => undefined)
	}
}
