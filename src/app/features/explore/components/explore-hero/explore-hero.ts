import { Component } from '@angular/core'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para explorehero.
 */
@Component({
	selector: 'app-explore-hero',
	imports: [TranslatePipe],
	templateUrl: './explore-hero.html',
})
export class ExploreHero {
	/**
	 * Propiedad para gestionar animation enlace.
	 */
	readonly animationUrl = '/assets/animacion.png'

}
