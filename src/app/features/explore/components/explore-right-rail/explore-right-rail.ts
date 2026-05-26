import { Component, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { from } from 'rxjs'
import { FeedService } from '@core/services/feed.service'
import { SupabaseService } from '@core/services/supabase.service'
import { AuthStore } from '@core/store/auth.store'
import { Post } from '@core/models/post/post.model'

interface Collection {
	key: string
	title: string
	count: number
	imageUrl: string | null
	postId: string
}

interface FeaturedChef {
	id: string
	username: string
	displayName: string
	avatarUrl: string | null
	bio: string | null
	postsCount: number
	followersCount: number
}

interface Trend {
	rank: number
	title: string
	count: number
	imageUrl: string | null
	postId: string
}

const CATEGORY_LABELS: Record<string, string> = {
	TRENDING: 'Tendencia', ITALIAN: 'Italiana', MEXICAN: 'Mexicana',
	JAPANESE: 'Japonesa', CHINESE: 'China', DESSERTS: 'Postres',
	VEGAN: 'Vegano', QUICK_EASY: 'Rápido y fácil', BURGER: 'Hamburguesas',
	SEAFOOD: 'Mariscos', COCKTAILS: 'Cócteles', BREAKFAST: 'Desayuno',
	LUNCH: 'Almuerzo', DINNER: 'Cena', SNACKS: 'Snacks',
	HEALTHY: 'Saludable', COMFORT_FOOD: 'Comfort Food', STREET_FOOD: 'Comida callejera',
}

import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
	selector: 'app-explore-right-rail',
	imports: [RouterLink, TranslatePipe],
	templateUrl: './explore-right-rail.html',
})
export class ExploreRightRail implements OnInit {
	private readonly feedService = inject(FeedService)
	private readonly supabase    = inject(SupabaseService)
	private readonly authStore   = inject(AuthStore)

	readonly collections    = signal<Collection[]>([])
	readonly featuredChef   = signal<FeaturedChef | null>(null)
	readonly trends         = signal<Trend[]>([])
	readonly loadingContent = signal(true)
	readonly loadingChef    = signal(true)

	ngOnInit(): void {
		this.loadPostData()
		this.loadFeaturedChef()
	}

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

	formatCount(n: number): string {
		if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'K'
		return String(n)
	}
}
