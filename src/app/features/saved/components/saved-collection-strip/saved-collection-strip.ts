import { Component, input, output } from '@angular/core'
import { SavedCollection } from '../../models/saved.models'

@Component({
	selector: 'app-saved-collection-strip',
	templateUrl: './saved-collection-strip.html',
})
export class SavedCollectionStrip {
	collections = input.required<SavedCollection[]>()
	selectCollection = output<string>()
}
