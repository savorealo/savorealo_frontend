import { Component, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core'
import { StoriesStore } from '@core/store/stories.store'
import { Avatar } from '@shared/components/avatar/avatar'
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'

const STORY_DURATION = 5000

@Component({
	selector: 'app-story-viewer',
	imports: [Avatar, TimeAgoPipe, ImgFallbackDirective],
	templateUrl: './story-viewer.html',
})
export class StoryViewer implements OnDestroy {
	readonly store = inject(StoriesStore)
	readonly progressPct = signal(0)
	private readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('storyVideo')

	private animFrame: number | null = null
	private startTime = 0
	private paused = false

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

	tap(side: 'left' | 'right'): void {
		if (side === 'left') {
			this.store.prevStory()
		} else {
			this.store.nextStory()
		}
	}

	holdStart(): void {
		this.paused = true
		if (this.store.activeStory()?.storyType === 'VIDEO') {
			this.videoEl()?.nativeElement.pause()
		} else {
			this.cancelTimer()
		}
	}

	holdEnd(): void {
		this.paused = false
		if (this.store.activeStory()?.storyType === 'VIDEO') {
			void this.videoEl()?.nativeElement.play()
		} else {
			this.continueTimer()
		}
	}

	close(): void {
		this.store.closeViewer()
	}

	storyTrack(_: number, idx: number): number { return idx }

	onVideoMetadata(): void {
		this.progressPct.set(0)
	}

	onVideoTimeUpdate(event: Event): void {
		const video = event.target as HTMLVideoElement
		if (!video.duration || Number.isNaN(video.duration)) {
			this.progressPct.set(0)
			return
		}
		this.progressPct.set(Math.min(100, (video.currentTime / video.duration) * 100))
	}

	private startTimer(): void {
		this.cancelTimer()
		this.progressPct.set(0)
		this.startTime = performance.now()
		this.paused = false
		this.tick()
	}

	private continueTimer(): void {
		const elapsed = (this.progressPct() / 100) * STORY_DURATION
		this.startTime = performance.now() - elapsed
		this.tick()
	}

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

	private cancelTimer(): void {
		if (this.animFrame !== null) {
			cancelAnimationFrame(this.animFrame)
			this.animFrame = null
		}
	}

	ngOnDestroy(): void {
		this.cancelTimer()
	}
}
