import { Component, computed, inject, output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { FeedService } from '@core/services/feed.service'
import { PostMediaService } from '@core/services/post-media.service'
import { ToastService } from '@core/services/toast.service'
import { Post } from '@core/models/post/post.model'
import { finalize, switchMap } from 'rxjs'

interface IngredientRow { name: string; quantity: string; unit: string }

@Component({
	selector: 'app-create-post',
	imports: [FormsModule],
	templateUrl: './create-post.component.html',
})
export class CreatePostComponent {
	private readonly feedService  = inject(FeedService)
	private readonly mediaService = inject(PostMediaService)
	private readonly toast        = inject(ToastService)

	postCreated = output<Post>()

	// ─── Post base ───────────────────────────────────────────────────
	readonly content      = signal('')
	readonly selectedFile = signal<File | null>(null)
	readonly previewUrl   = signal<string | null>(null)
	readonly uploadProgress = signal(0)
	readonly uploading    = signal(false)
	readonly publishing   = signal(false)
	readonly error        = signal('')

	// ─── Modo receta ─────────────────────────────────────────────────
	readonly isRecipe      = signal(false)
	readonly recipeName    = signal('')
	readonly difficulty    = signal('')
	readonly recipeTime    = signal<number | null>(null)
	readonly recipeServings = signal<number | null>(null)
	readonly ingredients   = signal<IngredientRow[]>([])
	readonly steps         = signal<string[]>([])

	readonly canPublish = computed(() => {
		if (this.publishing()) return false
		if (!this.content().trim()) return false
		if (this.isRecipe()) {
			if (!this.recipeName().trim()) return false
			if (this.ingredients().some(i => !i.name.trim())) return false
			if (this.steps().some(s => !s.trim())) return false
		}
		return true
	})

	// ─── Imagen ──────────────────────────────────────────────────────
	selectImage(event: Event): void {
		const file = (event.target as HTMLInputElement).files?.[0] ?? null
		if (!file) return
		this.selectedFile.set(file)
		this.previewUrl.set(URL.createObjectURL(file))
		;(event.target as HTMLInputElement).value = ''
	}

	removeImage(): void {
		const url = this.previewUrl()
		if (url) URL.revokeObjectURL(url)
		this.previewUrl.set(null)
		this.selectedFile.set(null)
	}

	// ─── Ingredientes ────────────────────────────────────────────────
	addIngredient(): void {
		this.ingredients.update(list => [...list, { name: '', quantity: '', unit: '' }])
	}

	removeIngredient(index: number): void {
		this.ingredients.update(list => list.filter((_, i) => i !== index))
	}

	updateIngredient(index: number, field: keyof IngredientRow, value: string): void {
		this.ingredients.update(list =>
			list.map((row, i) => i === index ? { ...row, [field]: value } : row),
		)
	}

	// ─── Pasos ───────────────────────────────────────────────────────
	addStep(): void {
		this.steps.update(list => [...list, ''])
	}

	removeStep(index: number): void {
		this.steps.update(list => list.filter((_, i) => i !== index))
	}

	updateStep(index: number, value: string): void {
		this.steps.update(list => list.map((s, i) => i === index ? value : s))
	}

	// ─── Publicar ────────────────────────────────────────────────────
	publish(): void {
		if (!this.canPublish()) return

		this.publishing.set(true)
		this.error.set('')

		const recipe = this.isRecipe() ? {
			name:        this.recipeName().trim(),
			difficulty:  this.difficulty() || null,
			timeRequired: this.recipeTime() ?? null,
			servings:    this.recipeServings() ?? null,
			ingredients: this.ingredients()
				.filter(i => i.name.trim())
				.map(i => ({
					name:     i.name.trim(),
					quantity: parseFloat(i.quantity) || 0,
					unit:     i.unit.trim(),
				})),
			steps: this.steps()
				.filter(s => s.trim())
				.map((text, idx) => ({ order: idx + 1, text: text.trim() })),
		} : null

		const file = this.selectedFile()
		const request = file
			? this.mediaService.uploadPostImage(file).pipe(
				switchMap(mediaUrl => {
					this.uploadProgress.set(100)
					return this.feedService.createPost({
						description: this.content().trim(),
						mediaUrl,
						mediaType: file.type.startsWith('video') ? 'video' : 'image',
						recipe,
					})
				}),
			)
			: this.feedService.createPost({ description: this.content().trim(), recipe })

		if (file) { this.uploading.set(true); this.uploadProgress.set(35) }

		request.pipe(
			finalize(() => { this.publishing.set(false); this.uploading.set(false); this.uploadProgress.set(0) }),
		).subscribe({
			next: post => {
				this.content.set('')
				this.recipeName.set('')
				this.difficulty.set('')
				this.recipeTime.set(null)
				this.recipeServings.set(null)
				this.ingredients.set([])
				this.steps.set([])
				this.isRecipe.set(false)
				this.removeImage()
				this.postCreated.emit(post)
				this.toast.success('Publicado', '')
			},
			error: err => {
				this.error.set(err.message ?? 'No se pudo publicar')
				this.toast.error('No se pudo publicar el post')
			},
		})
	}
}
