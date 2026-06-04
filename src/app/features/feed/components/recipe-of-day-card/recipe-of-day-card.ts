import { Component, inject, OnInit, signal } from '@angular/core'
import { Router } from '@angular/router'
import { from } from 'rxjs'
import { FeedService } from '@core/services/feed.service'
import { Post } from '@core/models/post/post.model'

/**
 * Clase de utilidad para recipeofdaycard.
 */
@Component({
	selector: 'app-recipe-of-day-card',
	templateUrl: './recipe-of-day-card.html',
})
export class RecipeOfDayCard implements OnInit {
	/**
	 * Propiedad para gestionar feed service.
	 */
	private readonly feedService = inject(FeedService)
	/**
	 * Propiedad para gestionar router.
	 */
	private readonly router      = inject(Router)

	/**
	 * Propiedad para gestionar post.
	 */
	readonly post    = signal<Post | null>(null)
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading = signal(true)

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al inicializar el componente.
	 */
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

	/**
	 * Método para imagen enlace.
	 */
	get imageUrl(): string {
		return this.post()?.media[0]?.url ?? ''
	}

	/**
	 * Método para título.
	 */
	get title(): string {
		return this.post()?.recipe?.name ?? this.post()?.title ?? ''
	}

	/**
	 * Método para ver recipe.
	 */
	viewRecipe(): void {
		const id = this.post()?.id
		if (id) this.router.navigate(['/posts', id])
	}
}
