import { Component, computed, inject, input, output, signal } from '@angular/core'
import { Post } from '@core/models/post/post.model'
import { REPORT_CATEGORIES, ReportCategory, ReportsService } from '@core/services/reports.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
	selector: 'app-report-sheet',
	imports: [TranslatePipe],
	templateUrl: './report-sheet.html',
})
export class ReportSheet {
	private readonly reports = inject(ReportsService)

	post = input.required<Post>()
	close = output<void>()

	readonly categories = REPORT_CATEGORIES
	readonly selectedCategory = signal<ReportCategory | null>(null)
	readonly detail = signal('')
	readonly submitting = signal(false)
	readonly error = signal<string | null>(null)
	readonly submitted = signal(false)

	readonly canSubmit = computed(() => !!this.selectedCategory() && !this.submitting() && !this.submitted())

	selectCategory(cat: ReportCategory): void {
		this.selectedCategory.set(cat)
		this.error.set(null)
	}

	onDetailInput(event: Event): void {
		this.detail.set((event.target as HTMLTextAreaElement).value)
	}

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

	onBackdropClick(): void {
		if (!this.submitting()) this.close.emit()
	}
}
