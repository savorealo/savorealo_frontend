import { Component, computed, inject, output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { FeedService } from '@core/services/feed.service'
import { PostMediaService } from '@core/services/post-media.service'
import { ToastService } from '@core/services/toast.service'
import { Post } from '@core/models/post/post.model'
import { finalize, switchMap } from 'rxjs'
import { ProgressBar } from 'primeng/progressbar'
import { Textarea } from 'primeng/textarea'

@Component({
	selector: 'app-create-post',
	imports: [FormsModule, ProgressBar, Textarea],
	template: `
		<form class="mx-auto grid w-full max-w-[500px] gap-3 rounded-2xl bg-white p-4 shadow-sm" (ngSubmit)="publish()">
			<div class="grid gap-2">
				<textarea
					pTextarea
					name="content"
					[(ngModel)]="content"
					maxlength="500"
					rows="3"
					class="w-full resize-none rounded-xl border border-black/10 bg-[#f6f6f6] p-3 text-sm font-semibold leading-6 outline-none placeholder:text-black/35 focus:border-[#ff8f27] focus:bg-white focus:ring-2 focus:ring-orange-100"
					placeholder="Comparte una receta, un antojo o tu ultimo descubrimiento..."
				></textarea>
				<div class="flex items-center justify-between text-xs font-semibold text-surface-500">
					<span>{{ error() }}</span>
					<span>{{ content().length }}/500</span>
				</div>
			</div>

			@if (previewUrl(); as preview) {
				<div class="relative overflow-hidden rounded-2xl border border-black/10">
					<img [src]="preview" alt="Preview de la imagen seleccionada" class="max-h-80 w-full object-cover" />
					<button
						type="button"
						class="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-surface-800 shadow-sm hover:bg-white"
						(click)="removeImage()"
						aria-label="Eliminar imagen"
					>
						<i class="pi pi-times"></i>
					</button>
				</div>
			}

			@if (uploading()) {
				<p-progressbar [value]="uploadProgress()" [showValue]="false" />
			}

			<div class="flex items-center gap-2">
				<input #fileInput type="file" accept="image/*" class="hidden" (change)="selectImage($event)" />
				<button
					type="button"
					class="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 px-4 text-sm font-black text-black/70 hover:bg-black/5"
					(click)="fileInput.click()"
				>
					<i class="pi pi-image"></i>
					<span>Imagen</span>
				</button>

				<button
					type="submit"
					class="ml-auto inline-flex min-h-10 items-center gap-2 rounded-full bg-[#ff8f27] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#f47f13] disabled:cursor-not-allowed disabled:opacity-50"
					[disabled]="!canPublish()"
				>
					<i class="pi pi-send"></i>
					<span>{{ publishing() ? 'Publicando...' : 'Publicar' }}</span>
				</button>
			</div>
		</form>
	`,
})
export class CreatePostComponent {
	private readonly feedService  = inject(FeedService)
	private readonly mediaService = inject(PostMediaService)
	private readonly toast        = inject(ToastService)

	postCreated = output<Post>()

	content = signal('')
	selectedFile = signal<File | null>(null)
	previewUrl = signal<string | null>(null)
	uploadProgress = signal(0)
	uploading = signal(false)
	publishing = signal(false)
	error = signal('')

	canPublish = computed(() =>
		this.content().trim().length > 0 && !this.publishing(),
	)

	selectImage(event: Event): void {
		const input = event.target as HTMLInputElement
		const file = input.files?.[0] ?? null
		if (!file) return

		this.selectedFile.set(file)
		this.previewUrl.set(URL.createObjectURL(file))
		input.value = ''
	}

	removeImage(): void {
		const preview = this.previewUrl()
		if (preview) URL.revokeObjectURL(preview)
		this.previewUrl.set(null)
		this.selectedFile.set(null)
	}

	publish(): void {
		const description = this.content().trim()
		if (!description || this.publishing()) return

		this.publishing.set(true)
		this.error.set('')

		const file = this.selectedFile()
		const request = file
			? this.mediaService.uploadPostImage(file).pipe(
				switchMap(mediaUrl => {
					this.uploadProgress.set(100)
					return this.feedService.createPost({ description, mediaUrl })
				}),
			)
			: this.feedService.createPost({ description })

		if (file) {
			this.uploading.set(true)
			this.uploadProgress.set(35)
		}

		request.pipe(
			finalize(() => {
				this.publishing.set(false)
				this.uploading.set(false)
				this.uploadProgress.set(0)
			}),
		).subscribe({
			next: post => {
				this.content.set('')
				this.removeImage()
				this.postCreated.emit(post)
				this.toast.success('¡Post publicado! 🎉', '')
			},
			error: err => {
				this.error.set(err.message ?? 'No se pudo publicar')
				this.toast.error('No se pudo publicar el post')
			},
		})
	}
}
