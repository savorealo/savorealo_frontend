import { Component } from '@angular/core'

interface Collection {
	id: number
	title: string
	count: string
	imageUrl: string
}

interface Trend {
	id: number
	title: string
	posts: string
	imageUrl: string
}

@Component({
	selector: 'app-explore-right-rail',
	templateUrl: './explore-right-rail.html',
})
export class ExploreRightRail {
	readonly chefImageUrl = '/assets/icons/new_logo.png'

	readonly collections: Collection[] = [
		{ id: 1, title: '🔥 Virales de la semana', count: '12 recetas', imageUrl: '/prueba1.png' },
		{ id: 2, title: '🍝 Pasta Lovers', count: '24 recetas', imageUrl: '/prueba1.png' },
		{ id: 3, title: '🥗 Healthy Meal Prep', count: '18 recetas', imageUrl: '/prueba1.png' },
		{ id: 4, title: '🍰 Postres irresistibles', count: '15 recetas', imageUrl: '/prueba1.png' },
	]

	readonly trends: Trend[] = [
		{ id: 1, title: 'Pasta cremosa con champinones', posts: '2.1K publicaciones', imageUrl: '/prueba1.png' },
		{ id: 2, title: 'Ramen picante', posts: '1.8K publicaciones', imageUrl: '/prueba1.png' },
		{ id: 3, title: 'Brownie saludable', posts: '1.5K publicaciones', imageUrl: '/prueba1.png' },
	]
}
