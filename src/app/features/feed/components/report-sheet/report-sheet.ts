import { Component, computed, inject, input, output, signal } from '@angular/core'
import { Post } from '@core/models/post/post.model'
import { REPORT_CATEGORIES, ReportCategory, ReportsService } from '@core/services/reports.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para reportsheet.
 */
@Component({
	selector: 'app-report-sheet',
	imports: [TranslatePipe],
	templateUrl: './report-sheet.html',
})
export class ReportSheet {
	/**
	 * Propiedad para gestionar reports.
	 */
	private readonly reports = inject(ReportsService)

	/**
	 * Propiedad para gestionar post.
	 */
	post = input.required<Post>()
	/**
	 * Propiedad para gestionar cerrar.
	 */
	close = output<void>()

	/**
	 * Propiedad para gestionar categories.
	 */
	readonly categories = REPORT_CATEGORIES
	/**
	 * Propiedad para gestionar selected category.
	 */
	readonly selectedCategory = signal<ReportCategory | null>(null)
	/**
	 * Propiedad para gestionar detail.
	 */
	readonly detail = signal('')
	/**
	 * Propiedad para gestionar submitting.
	 */
	readonly submitting = signal(false)
	/**
	 * Propiedad para gestionar error.
	 */
	readonly error = signal<string | null>(null)
	/**
	 * Propiedad para gestionar submitted.
	 */
	readonly submitted = signal(false)

	/**
	 * Indicador booleano para puede enviar.
	 */
	readonly canSubmit = computed(() => !!this.selectedCategory() && !this.submitting() && !this.submitted())

	/**
	 * Método para seleccionar category.
	 */
	selectCategory(cat: ReportCategory): void {
		this.selectedCategory.set(cat)
		this.error.set(null)
	}

	/**
	 * Método para evento de detail input.
	 */
	onDetailInput(event: Event): void {
		this.detail.set((event.target as HTMLTextAreaElement).value)
	}

	/**
	 * Método para enviar.
	 */
	submit(): void {
		const cat = this.selectedCategory()
		if (!cat || this.submitting() || this.submitted()) return

		this.submitting.set(true)
		this.error.set(null)

		this.reports.createReport(this.post().id, cat, this.detail()).subscribe({
			next: () => {
				this.submitting.set(false)
				this.submitted.set(true)
				// Auto-cerrar después de 1.5s para que el usuario vea el mensaje de éxito
				setTimeout(() => this.close.emit(), 1500)
			},
			error: err => {
				this.submitting.set(false)
				this.error.set(err?.message ?? 'No se pudo enviar el reporte')
			},
		})
	}

	/**
	 * Método para evento de backdrop click.
	 */
	onBackdropClick(): void {
		if (!this.submitting()) this.close.emit()
	}
}
