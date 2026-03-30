import { isPlatformBrowser } from '@angular/common'
import { inject, Injectable, PLATFORM_ID } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class IsOnServer {
  private platformId = inject(PLATFORM_ID)

  isServer(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return true
    } else return false
  }
}
