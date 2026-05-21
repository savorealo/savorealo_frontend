import { Component, effect, inject } from '@angular/core'
import { AuthStore } from '@core/store/auth.store'
import { CallStore } from '@core/store/call.store'
import { CallOverlay } from '@features/messages/components/call-overlay/call-overlay'
import { IncomingCall } from '@features/messages/components/incoming-call/incoming-call'

@Component({
	selector: 'app-call-host',
	imports: [IncomingCall, CallOverlay],
	template: `
		<app-incoming-call />
		<app-call-overlay />
	`,
})
export class CallHost {
	private readonly auth = inject(AuthStore)
	private readonly calls = inject(CallStore)

	constructor() {
		effect(() => {
			const userId = this.auth.currentUserId()
			if (userId) {
				this.calls.subscribeForCurrentUser()
			} else {
				this.calls.unsubscribeAll()
			}
		})
	}
}
