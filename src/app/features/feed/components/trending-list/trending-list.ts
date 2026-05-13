import { Component } from '@angular/core'

interface Trend {
	id: number
	title: string
	posts: string
	imageUrl: string
}

@Component({
	selector: 'app-trending-list',
	templateUrl: './trending-list.html',
})
export class TrendingList {
	readonly trends: Trend[] = [
		{ id: 1, title: 'Brownie saludable', posts: '1.2 K publicaciones', imageUrl: '/prueba1.png' },
		{ id: 2, title: 'Pasta Alfredo', posts: '984 publicaciones', imageUrl: '/prueba1.png' },
		{ id: 3, title: 'Bowl de acai', posts: '742 publicaciones', imageUrl: '/prueba1.png' },
	]
}
