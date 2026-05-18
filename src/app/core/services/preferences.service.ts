import { Injectable, signal } from '@angular/core'

const VEGAN_MODE_KEY = 'savorealo_vegan_mode'

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly _veganMode = signal(
    typeof localStorage !== 'undefined' && localStorage.getItem(VEGAN_MODE_KEY) === 'true',
  )

  readonly veganMode = this._veganMode.asReadonly()

  toggleVeganMode(): void {
    const next = !this._veganMode()
    this._veganMode.set(next)
    localStorage.setItem(VEGAN_MODE_KEY, String(next))
  }
}
