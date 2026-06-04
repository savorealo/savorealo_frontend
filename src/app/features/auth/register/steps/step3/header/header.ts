import { NgClass } from '@angular/common'
import { Component, input, output } from '@angular/core'

/**
 * Clase de utilidad para header.
 */
@Component({
  selector: 'app-header-step3',
  imports: [
    NgClass
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  /**
   * Propiedad para gestionar evento de active call back.
   */
  onActiveCallBack = output()
  /**
   * Propiedad para gestionar active step.
   */
  activeStep = input<number>()
  /**
   * Propiedad para gestionar valor.
   */
  value = input<number>()

  /**
   * Método para activate callback.
   */
  activateCallback() {
    this.onActiveCallBack.emit()
  }
}
