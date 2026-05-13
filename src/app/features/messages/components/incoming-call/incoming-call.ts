import { Component, inject } from '@angular/core'
import { CallStore } from '@core/store/call.store'

@Component({
	selector: 'app-incoming-call',
	templateUrl: './incoming-call.html',
})
export class IncomingCall {
	readonly store = inject(CallStore)
	readonly call  = this.store.call
}
