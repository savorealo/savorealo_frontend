import { isPlatformBrowser } from '@angular/common'
import { inject, Injectable, PLATFORM_ID } from '@angular/core'

/**
 * Clase de utilidad para isonserver.
 */
@Injectable({
  providedIn: 'root',
})
export class IsOnServer {
    /**
     * Propiedad para gestionar platform identificador.
     */
    private platformId = inject(PLATFORM_ID)

  /**
   * Método para es o está server.
   */
  isServer():boolean {
    if (isPlatformBrowser(this.platformId)) {
      return true
    }else return false
  }
}
