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
	private readonly localVideoEl  = viewChild<ElementRef<HTMLVideoElement>>('localVideo')

	readonly formattedDuration = computed(() => {
		const s = this.call().durationSeconds
		const mm = Math.floor(s / 60).toString().padStart(2, '0')
		const ss = (s % 60).toString().padStart(2, '0')
		return `${mm}:${ss}`
	})

	constructor() {
		effect(() => {
			const stream = this.store.remoteStream()
			const el     = this.remoteVideoEl()?.nativeElement
			if (el && stream) { el.srcObject = stream; el.play().catch(() => {}) }
		})
		effect(() => {
			const stream = this.store.localStream()
			const el     = this.localVideoEl()?.nativeElement
			if (el && stream) { el.srcObject = stream; el.play().catch(() => {}) }
		})
	}
}
