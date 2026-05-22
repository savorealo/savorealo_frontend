import { Directive, ElementRef, HostListener, inject, input } from '@angular/core'

@Directive({
  selector: 'img[appImgFallback]',
  standalone: true,
})
export class ImgFallbackDirective {
  readonly appImgFallback = input<string>('assets/images/image-fallback.svg')
  private readonly el = inject(ElementRef<HTMLImageElement>)
  private hasFailed = false

  @HostListener('error')
  onError(): void {
    if (this.hasFailed) return
    this.hasFailed = true
    this.el.nativeElement.src = this.appImgFallback()
  }
}
