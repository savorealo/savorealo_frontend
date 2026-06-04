import { Directive, ElementRef, HostListener, inject, input } from '@angular/core'

/**
 * Directiva que proporciona una imagen de reserva (fallback) en caso de que la imagen original falle al cargarse.
 */
@Directive({
  selector: 'img[appImgFallback]',
  standalone: true,
})
export class ImgFallbackDirective {
  /**
   * Ruta o URL de la imagen de reserva que se mostrará en caso de error.
   */
  readonly appImgFallback = input<string>('assets/images/image-fallback.svg')

  /**
   * Referencia inyectada al elemento de imagen HTML (<img>).
   */
  private readonly el = inject(ElementRef<HTMLImageElement>)

  /**
   * Indicador booleano para prevenir bucles infinitos en caso de que la propia imagen de reserva también falle.
   */
  private hasFailed = false

  /**
   * Escucha el evento de error de carga en el elemento de imagen y asigna la imagen de reserva como src.
   */
  @HostListener('error')
  onError(): void {
    if (this.hasFailed) return
    this.hasFailed = true
    this.el.nativeElement.src = this.appImgFallback()
  }
}
