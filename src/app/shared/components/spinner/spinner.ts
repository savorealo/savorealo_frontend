import { Component, Input } from '@angular/core'
import { ProgressSpinner } from 'primeng/progressspinner';

export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * Uso:
 * <!-- Uso -->
  <app-spinner />
  <app-spinner size="sm" />
  <app-spinner size="lg" message="Cargando feed..." />
  <app-spinner [overlay]="true" />
 */

@Component({
  selector: 'app-spinner',
  imports: [ProgressSpinner],
  template: `
    <div [class]="wrapperClass">
      <p-progressSpinner
        [style]="spinnerStyle"
        class="text-primary-500!"
        strokeWidth="4"
        animationDuration=".8s"
      />
      @if(message) {
        <span class="mt-2 text-sm text-surface-500">
          {{ message }}
        </span>
      }
    </div>
  `,
})
export class Spinner {
  @Input() size: SpinnerSize = 'md';
  @Input() message = '';
  @Input() overlay = false;

  get spinnerStyle() {
    const px = { sm: '24px', md: '40px', lg: '64px' }[this.size];
    return { width: px, height: px };
  }

  get wrapperClass() {
    const base = 'flex flex-col items-center justify-center';
    return this.overlay
      ? `${base} fixed inset-0 bg-black/30 z-50`
      : base;
  }
}
