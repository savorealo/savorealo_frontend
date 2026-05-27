import { Component, input } from '@angular/core'

/**
 * Componente de animación de carga personalizado para Savorealo.
 * Muestra el archivo GIF animado corporativo con soporte para distintos tamaños y mensajes personalizados.
 */
@Component({
  selector: 'app-savo-loader',
  template: `
    <div class="flex flex-col items-center justify-center gap-4" [class]="wrapperClass()">
      <img
        src="/assets/savo-loader.gif"
        [style.width.px]="sizePx()"
        alt="Cargando..."
        class="select-none"
      />
      @if (message()) {
        <p class="text-sm font-bold text-on-surface-muted">{{ message() }}</p>
      }
    </div>
  `,
})
export class SavoLoader {
  /**
   * Tamaño del cargador ('sm', 'md', o 'lg'). Por defecto es 'md'.
   */
  readonly size    = input<'sm' | 'md' | 'lg'>('md')

  /**
   * Mensaje opcional de texto a mostrar debajo de la animación de carga.
   */
  readonly message = input('')

  /**
   * Determina si se aplica padding vertical contenedor (py-12). Por defecto es true.
   */
  readonly padded  = input(true)

  /**
   * Resuelve el tamaño de la imagen en píxeles basándose en el input de tamaño.
   */
  sizePx() {
    return { sm: 80, md: 120, lg: 180 }[this.size()]
  }

  /**
   * Resuelve las clases CSS opcionales de espaciado según la configuración.
   */
  wrapperClass() {
    return this.padded() ? 'py-12' : ''
  }
}
