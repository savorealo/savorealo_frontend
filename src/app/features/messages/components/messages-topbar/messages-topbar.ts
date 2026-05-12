import { Component, inject, output } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthStore } from '@core/store/auth.store'

@Component({
	selector: 'app-messages-topbar',
	imports: [RouterLink],
	templateUrl: './messages-topbar.html',
})
export class MessagesTopbar {
	private readonly auth = inject(AuthStore)

	readonly profile = this.auth.profile

	newConversation = output<void>()
}
