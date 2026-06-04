import { Injectable, signal } from '@angular/core'

/**
 * Variable o constante para v e g a n m o d e k e y.
 */
const VEGAN_MODE_KEY = 'savorealo_vegan_mode'
/**
 * Variable o constante para v e g e t a r i a n m o d e k e y.
 */
const VEGETARIAN_MODE_KEY = 'savorealo_vegetarian_mode'

/**
 * Servicio que provee la lógica de negocio para preferences.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  /**
   * Propiedad para gestionar vegetarian mode.
   */
  private readonly _vegetarianMode = signal(
    typeof localStorage !== 'undefined' && localStorage.getItem(VEGETARIAN_MODE_KEY) === 'true',
  )

  /**
   * Propiedad para gestionar vegetarian mode.
   */
  readonly vegetarianMode = this._vegetarianMode.asReadonly()

  /**
   * Propiedad para gestionar vegan mode.
   */
  private readonly _veganMode = signal(
    typeof localStorage !== 'undefined' && localStorage.getItem(VEGAN_MODE_KEY) === 'true',
  )

  /**
   * Propiedad para gestionar vegan mode.
   */
  readonly veganMode = this._veganMode.asReadonly()

  /**
   * Método para alternar vegan mode.
   */
  toggleVeganMode(): void {
    const next = !this._veganMode()
    this._veganMode.set(next)
    localStorage.setItem(VEGAN_MODE_KEY, String(next))
  }

  /**
   * Método para alternar vegetarian mode.
   */
  toggleVegetarianMode(): void {
    const next = !this.vegetarianMode()
    this._vegetarianMode.set(next)
    localStorage.setItem(VEGETARIAN_MODE_KEY, String(next))
  }
}
