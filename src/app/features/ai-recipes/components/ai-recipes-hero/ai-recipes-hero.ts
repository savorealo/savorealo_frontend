import { Component, inject } from '@angular/core'
import { AuthStore } from '@core/store/auth.store'

import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
	selector: 'app-ai-recipes-hero',
	imports: [TranslatePipe],
	templateUrl: './ai-recipes-hero.html',
})
export class AiRecipesHero {
	private readonly auth = inject(AuthStore)

	readonly profile = this.auth.profile
	readonly logoUrl = '/assets/icons/new_logo.png'
}
