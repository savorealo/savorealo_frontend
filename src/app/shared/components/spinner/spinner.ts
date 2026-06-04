import { Component, input } from '@angular/core'
import { ProgressSpinner }  from 'primeng/progressspinner'

/**
 * Define los tamaños de visualización disponibles para el spinner de carga.
 */
export type SpinnerSize = 'sm' | 'md' | 'lg'

/**
 * Componente que representa un indicador de progreso de carga (spinner).
 * Admite múltiples tamaños, superposición (overlay) borrosa a pantalla completa y textos de carga opcionales.
 */
@Component({
  selector: 'app-spinner',
  imports: [ProgressSpinner],
  template: `
    <div [class]="wrapperClass()">
      <p-progressSpinner
        [style]="spinnerStyle()"
        strokeWidth="4"
        animationDuration=".8s"
      />
      @if (message()) {
        <span class="mt-2 text-body-sm text-on-surface-muted">{{ message() }}</span>
      }
    </div>
  `,
})
export class Spinner {
  /**
   * El tamaño del spinner ('sm', 'md' o 'lg'). Por defecto es 'md'.
   */
  readonly size    = input<SpinnerSize>('md')

  /**
   * Mensaje de texto descriptivo opcional que se muestra debajo del spinner.
   */
  readonly message = input('')

  /**
   * Si es verdadero, el spinner se dibuja sobre una pantalla completa translúcida y borrosa como overlay bloqueante.
   */
  readonly overlay = input(false)

  /**
   * Devuelve los estilos inline para el ancho y alto del spinner según el valor de size.
   */
  spinnerStyle() {
    const px = { sm: '24px', md: '40px', lg: '64px' }[this.size()]
    return { width: px, height: px }
  }

  /**
   * Resuelve el conjunto de clases CSS aplicables al contenedor del spinner según la configuración.
   */
  wrapperClass() {
    const base = 'flex flex-col items-center justify-center'
    return this.overlay()
      ? `${base} fixed inset-0 bg-surface/70 backdrop-blur-sm z-50`
      : base
  }
}
