import { Component, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { from } from 'rxjs'
import { FeedService } from '@core/services/feed.service'
import { SupabaseService } from '@core/services/supabase.service'
import { AuthStore } from '@core/store/auth.store'
import { Post } from '@core/models/post/post.model'

/**
 * Interfaz que define la estructura o contrato de datos para collection.
 */
interface Collection {
	/**
	 * Propiedad para gestionar clave.
	 */
	key: string
	/**
	 * Propiedad para gestionar título.
	 */
	title: string
	/**
	 * Propiedad para gestionar cantidad.
	 */
	count: number
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
 * Interfaz que define la estructura o contrato de datos para featuredchef.
 */
interface FeaturedChef {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username: string
	/**
	 * Propiedad para gestionar display nombre.
	 */
	displayName: string
	/**
	 * Propiedad para gestionar avatar enlace.
	 */
	avatarUrl: string | null
	/**
	 * Propiedad para gestionar biografía.
	 */
	bio: string | null
	/**
	 * Propiedad para gestionar posts cantidad.
	 */
	postsCount: number
	/**
	 * Propiedad para gestionar followers cantidad.
	 */
	followersCount: number
}

/**
 * Interfaz que define la estructura o contrato de datos para trend.
 */
interface Trend {
	/**
	 * Propiedad para gestionar rank.
	 */
	rank: number
	/**
	 * Propiedad para gestionar título.
	 */
	title: string
	/**
	 * Propiedad para gestionar cantidad.
	 */
	count: number
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
 * Variable o constante para c a t e g o r y l a b e l s.
 */
const CATEGORY_LABELS: Record<string, string> = {
	TRENDING: 'Tendencia', ITALIAN: 'Italiana', MEXICAN: 'Mexicana',
	JAPANESE: 'Japonesa', CHINESE: 'China', DESSERTS: 'Postres',
	VEGAN: 'Vegano', QUICK_EASY: 'Rápido y fácil', BURGER: 'Hamburguesas',
	SEAFOOD: 'Mariscos', COCKTAILS: 'Cócteles', BREAKFAST: 'Desayuno',
	LUNCH: 'Almuerzo', DINNER: 'Cena', SNACKS: 'Snacks',
	HEALTHY: 'Saludable', COMFORT_FOOD: 'Comfort Food', STREET_FOOD: 'Comida callejera',
}

import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para explorerightrail.
 */
@Component({
	selector: 'app-explore-right-rail',
	imports: [RouterLink, TranslatePipe],
	templateUrl: './explore-right-rail.html',
})
export class ExploreRightRail implements OnInit {
	/**
	 * Propiedad para gestionar feed service.
	 */
	private readonly feedService = inject(FeedService)
	/**
	 * Propiedad para gestionar supabase.
	 */
	private readonly supabase    = inject(SupabaseService)
	/**
	 * Propiedad para gestionar auth store.
	 */
	private readonly authStore   = inject(AuthStore)

	/**
	 * Propiedad para gestionar collections.
	 */
	readonly collections    = signal<Collection[]>([])
	/**
	 * Propiedad para gestionar featured chef.
	 */
	readonly featuredChef   = signal<FeaturedChef | null>(null)
	/**
	 * Propiedad para gestionar trends.
	 */
	readonly trends         = signal<Trend[]>([])
	/**
	 * Propiedad para gestionar cargando content.
	 */
	readonly loadingContent = signal(true)
	/**
	 * Propiedad para gestionar cargando chef.
	 */
	readonly loadingChef    = signal(true)

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al inicializar el componente.
	 */
	ngOnInit(): void {
		this.loadPostData()
		this.loadFeaturedChef()
	}

	/**
	 * Método para cargar post datos.
	 */
	private loadPostData(): void {
		from(this.feedService.fetchDiscoverGql(30)).subscribe({
			next: posts => {
				this.collections.set(this.buildCollections(posts))
				this.trends.set(this.buildTrends(posts))
				this.loadingContent.set(false)
			},
			error: () => this.loadingContent.set(false),
		})
	}

	/**
	 * Método para build collections.
	 */
	private buildCollections(posts: Post[]): Collection[] {
		const map = new Map<string, { count: number; post: Post }>()
		for (const post of posts) {
			for (const cat of (post.categories ?? [])) {
				if (!cat) continue
				const entry = map.get(cat)
				if (entry) { entry.count++ } else { map.set(cat, { count: 1, post }) }
			}
		}

		if (map.size >= 2) {
			return [...map.entries()]
				.sort((a, b) => b[1].count - a[1].count)
				.slice(0, 4)
				.map(([key, { count, post }]) => ({
					key,
					title: CATEGORY_LABELS[key] ?? key,
					count,
					imageUrl: post.media[0]?.url ?? null,
					postId: post.id,
				}))
		}

		return [...posts]
			.sort((a, b) => b.likesCount - a.likesCount)
			.slice(0, 4)
			.map(p => ({
				key: p.id,
				title: p.recipe?.name ?? p.title ?? 'Receta',
				count: p.likesCount,
				imageUrl: p.media[0]?.url ?? null,
				postId: p.id,
			}))
	}

	/**
	 * Método para build trends.
	 */
	private buildTrends(posts: Post[]): Trend[] {
		const sorted = [...posts].sort((a, b) => b.likesCount - a.likesCount).slice(0, 3)
		return sorted.map((p, i) => ({
			rank: i + 1,
			title: p.recipe?.name ?? p.title ?? 'Receta',
			count: p.likesCount,
			imageUrl: p.media[0]?.url ?? null,
			postId: p.id,
		}))
	}

	/**
	 * Método para cargar featured chef.
	 */
	private loadFeaturedChef(): void {
		const currentId = this.authStore.currentUserId()
		from(
			this.supabase.client
				.from('person_profiles')
				.select('user_id, username, display_name, avatar_url, bio, followers_count, posts_count')
				.order('followers_count', { ascending: false })
				.neq('user_id', currentId ?? '')
				.not('username', 'is', null)
				.limit(1)
				.maybeSingle(),
		).subscribe({
			next: ({ data }) => {
				if (data) {
					const d = data as {
						user_id: string; username: string; display_name: string | null
						avatar_url: string | null; bio: string | null
						followers_count: number | null; posts_count: number | null
					}
					this.featuredChef.set({
						id: d.user_id,
						username: d.username,
						displayName: d.display_name ?? d.username,
						avatarUrl: d.avatar_url,
						bio: d.bio,
						postsCount: d.posts_count ?? 0,
						followersCount: d.followers_count ?? 0,
					})
				}
				this.loadingChef.set(false)
			},
			error: () => this.loadingChef.set(false),
		})
	}

	/**
	 * Método para format cantidad.
	 */
	formatCount(n: number): string {
		if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'K'
		return String(n)
	}
}
