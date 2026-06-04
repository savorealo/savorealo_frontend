import { Component, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core'
import { StoriesStore } from '@core/store/stories.store'
import { Avatar } from '@shared/components/avatar/avatar'
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'

/**
 * Variable o constante para s t o r y d u r a t i o n.
 */
const STORY_DURATION = 5000

/**
 * Clase de utilidad para storyviewer.
 */
@Component({
	selector: 'app-story-viewer',
	imports: [Avatar, TimeAgoPipe, ImgFallbackDirective],
	templateUrl: './story-viewer.html',
})
export class StoryViewer implements OnDestroy {
	/**
	 * Propiedad para gestionar store.
	 */
	readonly store = inject(StoriesStore)
	/**
	 * Propiedad para gestionar progress pct.
	 */
	readonly progressPct = signal(0)
	/**
	 * Propiedad para gestionar video el.
	 */
	private readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('storyVideo')

	/**
	 * Propiedad para gestionar anim frame.
	 */
	private animFrame: number | null = null
	/**
	 * Propiedad para gestionar start tiempo.
	 */
	private startTime = 0
	/**
	 * Propiedad para gestionar paused.
	 */
	private paused = false

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
	constructor() {
		effect(() => {
			const story = this.store.activeStory()
			const open = this.store.viewerOpen()
			if (open && story) {
				if (story.storyType === 'VIDEO') {
					this.cancelTimer()
					this.progressPct.set(0)
					this.paused = false
				} else {
					this.startTimer()
				}
			} else {
				this.cancelTimer()
				this.progressPct.set(0)
			}
		})
	}

	/**
	 * Método para tap.
	 */
	tap(side: 'left' | 'right'): void {
		if (side === 'left') {
			this.store.prevStory()
		} else {
			this.store.nextStory()
		}
	}

	/**
	 * Método para hold start.
	 */
	holdStart(): void {
		this.paused = true
		if (this.store.activeStory()?.storyType === 'VIDEO') {
			this.videoEl()?.nativeElement.pause()
		} else {
			this.cancelTimer()
		}
	}

	/**
	 * Método para hold end.
	 */
	holdEnd(): void {
		this.paused = false
		if (this.store.activeStory()?.storyType === 'VIDEO') {
			void this.videoEl()?.nativeElement.play()
		} else {
			this.continueTimer()
		}
	}

	/**
	 * Método para cerrar.
	 */
	close(): void {
		this.store.closeViewer()
	}

	/**
	 * Método para story track.
	 */
	storyTrack(_: number, idx: number): number { return idx }

	/**
	 * Método para evento de video metadata.
	 */
	onVideoMetadata(): void {
		this.progressPct.set(0)
	}

	/**
	 * Método para evento de video tiempo actualizar.
	 */
	onVideoTimeUpdate(event: Event): void {
		const video = event.target as HTMLVideoElement
		if (!video.duration || Number.isNaN(video.duration)) {
			this.progressPct.set(0)
			return
		}
		this.progressPct.set(Math.min(100, (video.currentTime / video.duration) * 100))
	}

	/**
	 * Método para start timer.
	 */
	private startTimer(): void {
		this.cancelTimer()
		this.progressPct.set(0)
		this.startTime = performance.now()
		this.paused = false
		this.tick()
	}

	/**
	 * Método para continue timer.
	 */
	private continueTimer(): void {
		const elapsed = (this.progressPct() / 100) * STORY_DURATION
		this.startTime = performance.now() - elapsed
		this.tick()
	}

	/**
	 * Método para tick.
	 */
	private tick(): void {
		const frame = (now: number) => {
			if (this.paused) return
			const elapsed = now - this.startTime
			const pct = Math.min(100, (elapsed / STORY_DURATION) * 100)
			this.progressPct.set(pct)
			if (pct < 100) {
				this.animFrame = requestAnimationFrame(frame)
			} else {
				this.store.nextStory()
			}
		}
		this.animFrame = requestAnimationFrame(frame)
	}

	/**
	 * Método para cancelar timer.
	 */
	private cancelTimer(): void {
		if (this.animFrame !== null) {
			cancelAnimationFrame(this.animFrame)
			this.animFrame = null
		}
	}

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al destruir el componente para liberar recursos.
	 */
	ngOnDestroy(): void {
		this.cancelTimer()
	}
}
