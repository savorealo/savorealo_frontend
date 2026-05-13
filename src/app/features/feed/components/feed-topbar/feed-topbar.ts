import { Component, inject, output } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthStore } from '@core/store/auth.store'
import { GlobalSearchStore } from '@core/store/global-search.store'
import { NotificationsStore } from '@core/store/notifications.store'

@Component({
	selector: 'app-feed-topbar',
	imports: [RouterLink],
	templateUrl: './feed-topbar.html',
})
export class FeedTopbar {
	private readonly auth  = inject(AuthStore)
	readonly globalSearch  = inject(GlobalSearchStore)
	readonly notifications = inject(NotificationsStore)

	readonly profile = this.auth.profile
	readonly logoUrl = '/assets/icons/new_logo.png'

	create = output<void>()
}
