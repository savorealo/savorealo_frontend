import {
	Directive, Output, EventEmitter,
	OnInit, OnDestroy, ElementRef, Input
} from '@angular/core';

@Directive({
	selector: '[appInfiniteScroll]',
	standalone: true,
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
	@Input() threshold = 0.85;
	@Input() disabled = false;
	@Output() scrolled = new EventEmitter<void>();

	private observer!: IntersectionObserver;

	constructor(private el: ElementRef) { }

	ngOnInit(): void {
		this.observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !this.disabled) {
					this.scrolled.emit();
				}
			},
			{ threshold: this.threshold }
		);
		this.observer.observe(this.el.nativeElement);
	}

	ngOnDestroy(): void {
		this.observer.disconnect();
	}
}
