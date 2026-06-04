import { Component, input, output } from '@angular/core'
import { ExploreSort } from '@core/store/explore.store'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para exploretoolbar.
 */
@Component({
	selector: 'app-explore-toolbar',
	imports: [TranslatePipe],
	templateUrl: './explore-toolbar.html',
})
export class ExploreToolbar {
	/**
	 * Propiedad para gestionar sort.
	 */
	sort = input<ExploreSort>('relevant')
	/**
	 * Propiedad para gestionar sort cambiar.
	 */
	sortChange = output<ExploreSort>()

	/**
	 * Método para actualizar sort.
	 */
	updateSort(event: Event): void {
		this.sortChange.emit((event.target as HTMLSelectElement).value as ExploreSort)
	}
}
