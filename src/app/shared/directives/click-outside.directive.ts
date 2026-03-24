import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
	selector: '[appClickOutside]',
	standalone: true
})
export class ClickOutsideDirective {
	@Output() clickOutside = new EventEmitter<void>();

	constructor(private elementRef: ElementRef) { }

	@HostListener('document:click', ['$event'])
	@HostListener('document:touchstart', ['$event'])
	onClickOutside(event: MouseEvent | TouchEvent): void {
		if (!this.elementRef.nativeElement.contains(event.target)) {
			this.clickOutside.emit();
		}
	}
}
