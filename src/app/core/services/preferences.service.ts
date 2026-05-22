import { Injectable, signal } from '@angular/core'

const VEGAN_MODE_KEY = 'savorealo_vegan_mode'
const VEGETARIAN_MODE_KEY = 'savorealo_vegetarian_mode'

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly _vegetarianMode = signal(
    typeof localStorage !== 'undefined' && localStorage.getItem(VEGETARIAN_MODE_KEY) === 'true',
  )

  readonly vegetarianMode = this._vegetarianMode.asReadonly()

  private readonly _veganMode = signal(
    typeof localStorage !== 'undefined' && localStorage.getItem(VEGAN_MODE_KEY) === 'true',
  )

  readonly veganMode = this._veganMode.asReadonly()

  toggleVeganMode(): void {
    const next = !this._veganMode()
    this._veganMode.set(next)
    localStorage.setItem(VEGAN_MODE_KEY, String(next))
  }

  toggleVegetarianMode(): void {
    const next = !this.vegetarianMode()
    this._vegetarianMode.set(next)
    localStorage.setItem(VEGETARIAN_MODE_KEY, String(next))
  }
}
