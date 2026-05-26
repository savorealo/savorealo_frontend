import { Component } from '@angular/core'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
	selector: 'app-explore-hero',
	imports: [TranslatePipe],
	templateUrl: './explore-hero.html',
})
export class ExploreHero {
	readonly animationUrl = '/assets/animacion.png'

}
