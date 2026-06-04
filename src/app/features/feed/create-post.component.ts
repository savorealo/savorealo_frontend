import { Component, computed, inject, output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { FeedService } from '@core/services/feed.service'
import { PostMediaService } from '@core/services/post-media.service'
import { ToastService } from '@core/services/toast.service'
import { Post } from '@core/models/post/post.model'
import { finalize, switchMap } from 'rxjs'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Interfaz que define la estructura o contrato de datos para ingredientrow.
 */
interface IngredientRow {
	/**
	 * Propiedad para gestionar el nombre.
	 */
	name: string;
	/**
	 * Propiedad para gestionar la cantidad.
	 */
	quantity: string;
	/**
	 * Propiedad para gestionar la unidad.
	 */
	unit: string;
}

/**
 * Componente principal para la vista o página de createpost.
 */
@Component({
	selector: 'app-create-post',
	imports: [FormsModule, TranslatePipe],
	templateUrl: './create-post.component.html',
})
export class CreatePostComponent {
	/**
	 * Propiedad para gestionar feed service.
	 */
	private readonly feedService  = inject(FeedService)
	/**
	 * Propiedad para gestionar media service.
	 */
	private readonly mediaService = inject(PostMediaService)
	/**
	 * Propiedad para gestionar toast.
	 */
	private readonly toast        = inject(ToastService)

	/**
	 * Propiedad para gestionar post created.
	 */
	postCreated = output<Post>()

	// ─── Post base ───────────────────────────────────────────────────
	/**
	 * Propiedad para gestionar content.
	 */
	readonly content      = signal('')
	/**
	 * Propiedad para gestionar selected file.
	 */
	readonly selectedFile = signal<File | null>(null)
	/**
	 * Propiedad para gestionar preview enlace.
	 */
	readonly previewUrl   = signal<string | null>(null)
	/**
	 * Propiedad para gestionar upload progress.
	 */
	readonly uploadProgress = signal(0)
	/**
	 * Propiedad para gestionar uploading.
	 */
	readonly uploading    = signal(false)
	/**
	 * Propiedad para gestionar publishing.
	 */
	readonly publishing   = signal(false)
	/**
	 * Propiedad para gestionar error.
	 */
	readonly error        = signal('')

	// ─── Modo receta ─────────────────────────────────────────────────
	/**
	 * Indicador booleano para es o está recipe.
	 */
	readonly isRecipe      = signal(false)
	/**
	 * Propiedad para gestionar recipe nombre.
	 */
	readonly recipeName    = signal('')
	/**
	 * Propiedad para gestionar difficulty.
	 */
	readonly difficulty    = signal('')
	/**
	 * Propiedad para gestionar recipe tiempo.
	 */
	readonly recipeTime    = signal<number | null>(null)
	/**
	 * Propiedad para gestionar recipe servings.
	 */
	readonly recipeServings = signal<number | null>(null)
	/**
	 * Propiedad para gestionar ingredients.
	 */
	readonly ingredients   = signal<IngredientRow[]>([])
	/**
	 * Propiedad para gestionar steps.
	 */
	readonly steps         = signal<string[]>([])

	/**
	 * Indicador booleano para puede publish.
	 */
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
	/**
	 * Método para seleccionar imagen.
	 */
	selectImage(event: Event): void {
		const file = (event.target as HTMLInputElement).files?.[0] ?? null
		if (!file) return
		this.selectedFile.set(file)
		this.previewUrl.set(URL.createObjectURL(file))
		;(event.target as HTMLInputElement).value = ''
	}

	/**
	 * Método para eliminar imagen.
	 */
	removeImage(): void {
		const url = this.previewUrl()
		if (url) URL.revokeObjectURL(url)
		this.previewUrl.set(null)
		this.selectedFile.set(null)
	}

	// ─── Ingredientes ────────────────────────────────────────────────
	/**
	 * Método para añadir ingredient.
	 */
	addIngredient(): void {
		this.ingredients.update(list => [...list, { name: '', quantity: '', unit: '' }])
	}

	/**
	 * Método para eliminar ingredient.
	 */
	removeIngredient(index: number): void {
		this.ingredients.update(list => list.filter((_, i) => i !== index))
	}

	/**
	 * Método para actualizar ingredient.
	 */
	updateIngredient(index: number, field: keyof IngredientRow, value: string): void {
		this.ingredients.update(list =>
			list.map((row, i) => i === index ? { ...row, [field]: value } : row),
		)
	}

	// ─── Pasos ───────────────────────────────────────────────────────
	/**
	 * Método para añadir step.
	 */
	addStep(): void {
		this.steps.update(list => [...list, ''])
	}

	/**
	 * Método para eliminar step.
	 */
	removeStep(index: number): void {
		this.steps.update(list => list.filter((_, i) => i !== index))
	}

	/**
	 * Método para actualizar step.
	 */
	updateStep(index: number, value: string): void {
		this.steps.update(list => list.map((s, i) => i === index ? value : s))
	}

	// ─── Publicar ────────────────────────────────────────────────────
	/**
	 * Método para publish.
	 */
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
