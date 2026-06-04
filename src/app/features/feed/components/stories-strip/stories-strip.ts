import { Component, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core'
import { StoriesStore } from '@core/store/stories.store'
import { Avatar } from '@shared/components/avatar/avatar'

/**
 * Clase de utilidad para storiesstrip.
 */
@Component({
	selector: 'app-stories-strip',
	imports: [Avatar],
	templateUrl: './stories-strip.html',
})
export class StoriesStrip implements OnDestroy {
	/**
	 * Propiedad para gestionar store.
	 */
	readonly store = inject(StoriesStore)

	/**
	 * Propiedad para gestionar menu abrir.
	 */
	readonly menuOpen = signal(false)
	/**
	 * Propiedad para gestionar selected file.
	 */
	readonly selectedFile = signal<File | null>(null)
	/**
	 * Propiedad para gestionar preview enlace.
	 */
	readonly previewUrl = signal<string | null>(null)
	/**
	 * Propiedad para gestionar uploading.
	 */
	readonly uploading = signal(false)
	/**
	 * Propiedad para gestionar camera abrir.
	 */
	readonly cameraOpen = signal(false)
	/**
	 * Propiedad para gestionar camera error.
	 */
	readonly cameraError = signal<string | null>(null)

	/**
	 * Propiedad para gestionar stream.
	 */
	private stream: MediaStream | null = null
	/**
	 * Propiedad para gestionar video el.
	 */
	private readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('cameraVideo')
	/**
	 * Indicador booleano para canvas el.
	 */
	private readonly canvasEl = viewChild<ElementRef<HTMLCanvasElement>>('cameraCanvas')

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al destruir el componente para liberar recursos.
	 */
	ngOnDestroy(): void {
		this._revokePreview()
		this._stopStream()
	}

	/**
	 * Método para evento de file selected.
	 */
	onFileSelected(event: Event): void {
		const file = (event.target as HTMLInputElement).files?.[0]
		if (!file) return
		this._revokePreview()
		this.selectedFile.set(file)
		this.previewUrl.set(URL.createObjectURL(file))
		this.menuOpen.set(false)
		;(event.target as HTMLInputElement).value = ''
	}

	/**
	 * Método para abrir camera.
	 */
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

	/**
	 * Método para capture foto.
	 */
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

	/**
	 * Método para cerrar camera.
	 */
	closeCamera(): void {
		this._stopStream()
		this.cameraOpen.set(false)
		this.cameraError.set(null)
	}

	/**
	 * Método para publish.
	 */
	publish(): void {
		const file = this.selectedFile()
		if (!file || this.uploading()) return
		this.uploading.set(true)
		this.store.addStory(file).subscribe({
			next: () => this.cancel(),
			error: () => this.uploading.set(false),
		})
	}

	/**
	 * Método para cancelar.
	 */
	cancel(): void {
		this._revokePreview()
		this.selectedFile.set(null)
		this.previewUrl.set(null)
		this.uploading.set(false)
	}

	/**
	 * Método para stop stream.
	 */
	private _stopStream(): void {
		this.stream?.getTracks().forEach(t => t.stop())
		this.stream = null
	}

	/**
	 * Método para revoke preview.
	 */
	private _revokePreview(): void {
		const url = this.previewUrl()
		if (url) URL.revokeObjectURL(url)
	}
}
