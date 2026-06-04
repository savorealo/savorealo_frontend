import { Component, inject } from '@angular/core'
import { CallStore } from '@core/store/call.store'

/**
 * Clase de utilidad para incomingcall.
 */
@Component({
	selector: 'app-incoming-call',
	templateUrl: './incoming-call.html',
})
export class IncomingCall {
	/**
	 * Propiedad para gestionar store.
	 */
	readonly store = inject(CallStore)
	/**
	 * Propiedad para gestionar call.
	 */
	readonly call  = this.store.call
}
