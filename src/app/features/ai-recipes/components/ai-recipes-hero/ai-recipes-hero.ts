import { Component, inject } from '@angular/core'
import { AuthStore } from '@core/store/auth.store'

import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para airecipeshero.
 */
@Component({
	selector: 'app-ai-recipes-hero',
	imports: [TranslatePipe],
	templateUrl: './ai-recipes-hero.html',
})
export class AiRecipesHero {
	/**
	 * Propiedad para gestionar auth.
	 */
	private readonly auth = inject(AuthStore)

	/**
	 * Propiedad para gestionar profile.
	 */
	readonly profile = this.auth.profile
	/**
	 * Propiedad para gestionar logo enlace.
	 */
	readonly logoUrl = '/assets/icons/new_logo.png'
}
