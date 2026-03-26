import {
  Component,
  ElementRef,
  HostListener,
} from '@angular/core';

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

  constructor(
    private el: ElementRef<HTMLElement>,
  ) {}

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
    this.el.nativeElement.style.setProperty('--mx', x);
    this.el.nativeElement.style.setProperty('--my', y);
  }
}