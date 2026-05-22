import { Component, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core'
import { StoriesStore } from '@core/store/stories.store'
import { Avatar } from '@shared/components/avatar/avatar'

@Component({
	selector: 'app-stories-strip',
	imports: [Avatar],
	templateUrl: './stories-strip.html',
})
export class StoriesStrip implements OnDestroy {
	readonly store = inject(StoriesStore)

	readonly menuOpen = signal(false)
	readonly selectedFile = signal<File | null>(null)
	readonly previewUrl = signal<string | null>(null)
	readonly uploading = signal(false)
	readonly cameraOpen = signal(false)
	readonly cameraError = signal<string | null>(null)

	private stream: MediaStream | null = null
	private readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('cameraVideo')
	private readonly canvasEl = viewChild<ElementRef<HTMLCanvasElement>>('cameraCanvas')

	ngOnDestroy(): void {
		this._revokePreview()
		this._stopStream()
	}

	onFileSelected(event: Event): void {
		const file = (event.target as HTMLInputElement).files?.[0]
		if (!file) return
		this._revokePreview()
		this.selectedFile.set(file)
		this.previewUrl.set(URL.createObjectURL(file))
		this.menuOpen.set(false)
		;(event.target as HTMLInputElement).value = ''
	}

	async openCamera(): Promise<void> {
		this.menuOpen.set(false)
		this.cameraError.set(null)
		this.cameraOpen.set(true)

		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
				audio: false,
			})
			// Wait one tick for the video element to render
			setTimeout(() => {
				const video = this.videoEl()?.nativeElement
				if (video) {
					video.srcObject = this.stream
					video.play()
				}
			}, 50)
		} catch {
			this.cameraError.set('No se pudo acceder a la cámara. Revisa los permisos del navegador.')
		}
	}

	capturePhoto(): void {
		const video = this.videoEl()?.nativeElement
		const canvas = this.canvasEl()?.nativeElement
		if (!video || !canvas) return

		canvas.width = video.videoWidth
		canvas.height = video.videoHeight
		canvas.getContext('2d')!.drawImage(video, 0, 0)

		canvas.toBlob(blob => {
			if (!blob) return
			const file = new File([blob], `story-${Date.now()}.jpg`, { type: 'image/jpeg' })
			this._revokePreview()
			this.selectedFile.set(file)
			this.previewUrl.set(URL.createObjectURL(file))
			this.closeCamera()
		}, 'image/jpeg', 0.92)
	}

	closeCamera(): void {
		this._stopStream()
		this.cameraOpen.set(false)
		this.cameraError.set(null)
	}

	publish(): void {
		const file = this.selectedFile()
		if (!file || this.uploading()) return
		this.uploading.set(true)
		this.store.addStory(file).subscribe({
			next: () => this.cancel(),
			error: () => this.uploading.set(false),
		})
	}

	cancel(): void {
		this._revokePreview()
		this.selectedFile.set(null)
		this.previewUrl.set(null)
		this.uploading.set(false)
	}

	private _stopStream(): void {
		this.stream?.getTracks().forEach(t => t.stop())
		this.stream = null
	}

	private _revokePreview(): void {
		const url = this.previewUrl()
		if (url) URL.revokeObjectURL(url)
	}
}
