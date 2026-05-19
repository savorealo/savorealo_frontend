import { Component, inject, OnInit, signal } from '@angular/core'
import { Router } from '@angular/router'
import { from } from 'rxjs'
import { FeedService } from '@core/services/feed.service'
import { Post } from '@core/models/post/post.model'

@Component({
	selector: 'app-recipe-of-day-card',
	templateUrl: './recipe-of-day-card.html',
})
export class RecipeOfDayCard implements OnInit {
	private readonly feedService = inject(FeedService)
	private readonly router      = inject(Router)

	readonly post    = signal<Post | null>(null)
	readonly loading = signal(true)

	ngOnInit(): void {
		from(this.feedService.fetchDiscoverGql(15)).subscribe({
			next: posts => {
				const pick = posts.find(p => p.recipe && p.media.length > 0 && p.media[0].url)
				this.post.set(pick ?? null)
				this.loading.set(false)
			},
			error: () => this.loading.set(false),
		})
	}

	get imageUrl(): string {
		return this.post()?.media[0]?.url ?? ''
	}

	get title(): string {
		return this.post()?.recipe?.name ?? this.post()?.title ?? ''
	}

	viewRecipe(): void {
		const id = this.post()?.id
		if (id) this.router.navigate(['/posts', id])
	}
}
