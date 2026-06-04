import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

/**
 * Directiva que detecta y notifica clics o interacciones táctiles fuera del elemento anfitrión.
 */
@Directive({
	selector: '[appClickOutside]',
	standalone: true
})
export class ClickOutsideDirective {
	/**
	 * Emisor de eventos que se dispara cuando se hace clic fuera del elemento.
	 */
	@Output() clickOutside = new EventEmitter<void>();

	/**
	 * Crea una instancia de ClickOutsideDirective.
	 * @param elementRef Referencia inyectada al elemento DOM anfitrión.
	 */
	constructor(private elementRef: ElementRef) { }

	/**
	 * Escucha clics y toques táctiles a nivel de documento global para determinar si ocurrieron fuera del elemento.
	 * @param event Evento de clic o toque del ratón/dispositivo táctil.
	 */
	@HostListener('document:click', ['$event'])
	@HostListener('document:touchstart', ['$event'])
	onClickOutside(event: MouseEvent | TouchEvent): void {
		if (!this.elementRef.nativeElement.contains(event.target)) {
			this.clickOutside.emit();
		}
	}
}
