import { NgClass } from '@angular/common'
import { Component, input, output } from '@angular/core'

@Component({
  selector: 'app-header-step3',
  imports: [
    NgClass
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  onActiveCallBack = output()
  activeStep = input<number>()
  value = input<number>()

  activateCallback() {
    this.onActiveCallBack.emit()
  }
}
