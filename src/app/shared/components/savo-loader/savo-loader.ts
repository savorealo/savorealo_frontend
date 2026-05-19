import { Component, input } from '@angular/core'

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
  readonly size    = input<'sm' | 'md' | 'lg'>('md')
  readonly message = input('')
  readonly padded  = input(true)

  sizePx() {
    return { sm: 80, md: 120, lg: 180 }[this.size()]
  }

  wrapperClass() {
    return this.padded() ? 'py-12' : ''
  }
}
