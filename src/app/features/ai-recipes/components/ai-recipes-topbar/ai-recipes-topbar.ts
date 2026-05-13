import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthStore } from '@core/store/auth.store'

@Component({
	selector: 'app-ai-recipes-topbar',
	imports: [RouterLink],
	templateUrl: './ai-recipes-topbar.html',
})
export class AiRecipesTopbar {
	private readonly auth = inject(AuthStore)

	readonly profile = this.auth.profile
	readonly logoUrl = '/assets/icons/new_logo.png'
}
