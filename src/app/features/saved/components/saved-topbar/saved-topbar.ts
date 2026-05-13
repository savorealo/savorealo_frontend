import { Component, inject, output } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthStore } from '@core/store/auth.store'

@Component({
	selector: 'app-saved-topbar',
	imports: [RouterLink],
	templateUrl: './saved-topbar.html',
})
export class SavedTopbar {
	private readonly auth = inject(AuthStore)

	readonly profile = this.auth.profile
	readonly logoUrl = '/assets/icons/new_logo.png'

	create = output<void>()
}
