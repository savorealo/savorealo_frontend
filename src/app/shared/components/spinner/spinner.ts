import { Component, input } from '@angular/core'
import { ProgressSpinner }  from 'primeng/progressspinner'

export type SpinnerSize = 'sm' | 'md' | 'lg'

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
  readonly size    = input<SpinnerSize>('md')
  readonly message = input('')
  readonly overlay = input(false)

  spinnerStyle() {
    const px = { sm: '24px', md: '40px', lg: '64px' }[this.size()]
    return { width: px, height: px }
  }

  wrapperClass() {
    const base = 'flex flex-col items-center justify-center'
    return this.overlay()
      ? `${base} fixed inset-0 bg-surface/70 backdrop-blur-sm z-50`
      : base
  }
}
