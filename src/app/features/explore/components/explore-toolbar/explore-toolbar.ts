import { Component, input, output } from '@angular/core'
import { ExploreSort } from '@core/store/explore.store'

@Component({
	selector: 'app-explore-toolbar',
	templateUrl: './explore-toolbar.html',
})
export class ExploreToolbar {
	sort = input<ExploreSort>('relevant')
	sortChange = output<ExploreSort>()

	updateSort(event: Event): void {
		this.sortChange.emit((event.target as HTMLSelectElement).value as ExploreSort)
	}
}
