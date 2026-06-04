import { Component, inject, input, model, output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AuthStore } from '@core/store/auth.store'
import { PlacesService } from '@core/services/places.service'
import { DialogModule } from 'primeng/dialog'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para addreviewmodal.
 */
@Component({
  selector: 'app-add-review-modal',
  imports: [DialogModule, FormsModule, TranslatePipe],
  templateUrl: './add-review-modal.html',
})
/**
 * Componente que representa el diálogo modal para que el usuario añada una reseña y valoración de estrellas a un establecimiento.
 * Permite seleccionar de 1 a 5 estrellas, redactar un comentario y enviar los datos al servidor.
 */
export class AddReviewModal {
  /**
   * Servicio de comunicación de lugares gastronómicos inyectado.
   */
  private readonly service = inject(PlacesService)

  /**
   * Almacén de estado de autenticación inyectado.
   */
  private readonly auth    = inject(AuthStore)

  /**
   * Identificador del establecimiento al cual se le va a añadir la opinión.
   */
  placeId  = input.required<string>()

  /**
   * Modelo bidireccional (two-way binding) que gestiona la visibilidad del diálogo modal.
   */
  visible  = model(false)

  /**
   * Emisor de evento que notifica al componente padre cuando la reseña se ha insertado con éxito.
   */
  reviewed = output<void>()

  /**
   * Valores fijos de puntuaciones en estrellas (1 a 5).
   */
  readonly stars = [1, 2, 3, 4, 5]

  /**
   * Señal con la puntuación en estrellas actualmente seleccionada.
   */
  rating  = signal(0)

  /**
   * Señal con la puntuación en estrellas sobre la que el cursor del ratón está suspendido (hover).
   */
  hovered = signal(0)

  /**
   * Señal que almacena el comentario de texto del usuario.
   */
  comment = signal('')

  /**
   * Señal reactiva que indica si la petición de guardado está en proceso.
   */
  saving  = signal(false)

  /**
   * Señal reactiva que contiene el mensaje de error si ocurriera un fallo al enviar.
   */
  error   = signal<string | null>(null)

  /**
   * Comprueba si una estrella concreta debe mostrarse con el estado activo (rellena) según el hover o rating actual.
   * @param n Número de la estrella.
   */
  starActive(n: number): boolean {
    return n <= (this.hovered() || this.rating())
  }

  /**
   * Envía la reseña al servidor validando previamente que la valoración en estrellas sea mayor que cero.
   */
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
