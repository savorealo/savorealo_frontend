import {
  Component,
  ElementRef,
  HostListener,
} from '@angular/core';

/**
 * Componente decorativo que proyecta un efecto visual de foco (spotlight) interactivo en el fondo.
 * El foco sigue las coordenadas del puntero del ratón dinámicamente mediante variables CSS.
 */
@Component({
  selector: 'app-spotlight-bg',
  standalone: true,
  template: ``,
  styles: [`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      background-color: var(--color-surface-50);
      background-image: radial-gradient(
        circle at var(--mx, 10%) var(--my, 10%),
        rgba(255, 120, 50, 0.15) 0%,
        rgba(255, 90, 26, 0.07) 15%,
        transparent 35%
      );
      z-index: -10;
      pointer-events: none;
    }
  `]
})
export class SpotlightBg {

  /**
   * Crea una instancia de SpotlightBg.
   * @param el Referencia inyectada al elemento DOM del componente para manipular variables CSS.
   */
  constructor(
    private el: ElementRef<HTMLElement>,
  ) {}

  /**
   * Escucha los movimientos del ratón en todo el documento para calcular la posición relativa del puntero.
   * Modifica las variables CSS --mx y --my del elemento.
   * @param e Evento del ratón.
   */
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
    this.el.nativeElement.style.setProperty('--mx', x);
    this.el.nativeElement.style.setProperty('--my', y);
  }
}