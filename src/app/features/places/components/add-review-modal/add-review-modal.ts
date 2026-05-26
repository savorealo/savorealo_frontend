import { Component, inject, input, model, output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AuthStore } from '@core/store/auth.store'
import { PlacesService } from '@core/services/places.service'
import { DialogModule } from 'primeng/dialog'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
  selector: 'app-add-review-modal',
  imports: [DialogModule, FormsModule, TranslatePipe],
  templateUrl: './add-review-modal.html',
})
export class AddReviewModal {
  private readonly service = inject(PlacesService)
  private readonly auth    = inject(AuthStore)

  placeId  = input.required<string>()
  visible  = model(false)
  reviewed = output<void>()

  readonly stars = [1, 2, 3, 4, 5]

  rating  = signal(0)
  hovered = signal(0)
  comment = signal('')
  saving  = signal(false)
  error   = signal<string | null>(null)

  starActive(n: number): boolean {
    return n <= (this.hovered() || this.rating())
  }

  submit(): void {
    if (this.rating() === 0) { this.error.set('places.review.error_select_rating'); return }
    const userId = this.auth.currentUserId()
    if (!userId) return

    this.saving.set(true)
    this.error.set(null)

    this.service.addReview(this.placeId(), userId, this.rating(), this.comment()).subscribe({
      next: () => {
        this.saving.set(false)
        this.visible.set(false)
        this.rating.set(0)
        this.comment.set('')
        this.reviewed.emit()
      },
      error: () => {
        this.error.set('places.review.error_save')
        this.saving.set(false)
      },
    })
  }
}
