import { Component, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { from } from 'rxjs'
import { FeedService } from '@core/services/feed.service'
import { Post } from '@core/models/post/post.model'

/**
 * Interfaz que define la estructura o contrato de datos para trend.
 */
interface Trend {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar título.
	 */
	title: string
	/**
	 * Propiedad para gestionar posts.
	 */
	posts: string
	/**
	 * Propiedad para gestionar imagen enlace.
	 */
	imageUrl: string | null
	/**
	 * Propiedad para gestionar post identificador.
	 */
	postId: string
}

/**
 * Clase de utilidad para trendinglist.
 */
@Component({
	selector: 'app-trending-list',
	imports: [RouterLink],
	templateUrl: './trending-list.html',
})
export class TrendingList implements OnInit {
	/**
	 * Propiedad para gestionar feed service.
	 */
	private readonly feedService = inject(FeedService)

	/**
	 * Propiedad para gestionar trends.
	 */
	readonly trends  = signal<Trend[]>([])
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading = signal(true)

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al inicializar el componente.
	 */
	ngOnInit(): void {
		from(this.feedService.fetchDiscoverGql(30)).subscribe({
			next: posts => {
				this.trends.set(this.buildTrends(posts))
				this.loading.set(false)
			},
			error: () => this.loading.set(false),
		})
	}

	/**
	 * Propiedad para gestionar category labels.
	 */
	private readonly categoryLabels: Record<string, string> = {
		TRENDING: 'Tendencia', ITALIAN: 'Italiana', MEXICAN: 'Mexicana',
		JAPANESE: 'Japonesa', CHINESE: 'China', DESSERTS: 'Postres',
		VEGAN: 'Vegano', QUICK_EASY: 'Rápido y fácil', BURGER: 'Hamburguesas',
		SEAFOOD: 'Mariscos', COCKTAILS: 'Cócteles', BREAKFAST: 'Desayuno',
		LUNCH: 'Almuerzo', DINNER: 'Cena', SNACKS: 'Snacks',
		HEALTHY: 'Saludable', COMFORT_FOOD: 'Comfort Food', STREET_FOOD: 'Comida callejera',
	}

	/**
	 * Método para build trends.
	 */
	private buildTrends(posts: Post[]): Trend[] {
		const catMap = new Map<string, { count: number; post: Post }>()

		for (const post of posts) {
			const cats = post.categories ?? []
			for (const cat of cats) {
				if (!cat) continue
				const existing = catMap.get(cat)
				if (existing) {
					existing.count++
				} else {
					catMap.set(cat, { count: 1, post })
				}
			}
		}

		if (catMap.size >= 3) {
			return [...catMap.entries()]
				.sort((a, b) => b[1].count - a[1].count)
				.slice(0, 5)
				.map(([cat, { count, post }], i) => ({
					id:      String(i + 1),
					title:   this.categoryLabels[cat] ?? cat,
					posts:   `${count} publicacion${count !== 1 ? 'es' : ''}`,
					imageUrl: post.media[0]?.url ?? null,
					postId:  post.id,
				}))
		}

		return posts
			.slice(0, 5)
			.map((post, i) => ({
				id:      String(i + 1),
				title:   post.recipe?.name ?? post.title ?? 'Receta',
				posts:   `${post.likesCount} me gusta`,
				imageUrl: post.media[0]?.url ?? null,
				postId:  post.id,
			}))
	}
}
