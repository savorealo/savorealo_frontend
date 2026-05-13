import { Component } from '@angular/core'

interface Suggestion {
	id: number
	name: string
	username: string
	avatarUrl: string
}

@Component({
	selector: 'app-suggestions-panel',
	templateUrl: './suggestions-panel.html',
})
export class SuggestionsPanel {
	readonly suggestions: Suggestion[] = [
		{ id: 1, name: 'Nombre', username: '@username', avatarUrl: '/assets/icons/new_logo.png' },
		{ id: 2, name: 'Nombre', username: '@username', avatarUrl: '/assets/icons/new_logo.png' },
		{ id: 3, name: 'Nombre', username: '@username', avatarUrl: '/assets/icons/new_logo.png' },
	]
}
