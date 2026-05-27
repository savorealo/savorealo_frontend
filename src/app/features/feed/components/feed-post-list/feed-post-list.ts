import { afterNextRender, Component, ElementRef, input, OnDestroy, output, signal, viewChild } from '@angular/core'
import { Post }        from '@core/models/post/post.model'
import { Emptystate }  from '@shared/components/emptystate/emptystate'
import { PostCard }    from '@shared/components/post-card/post-card'
import { SkeletonCard } from '@shared/components/skeleton-card/skeleton-card'
import { Spinner }     from '@shared/components/spinner/spinner'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Clase de utilidad para feedpostlist.
 */
@Component({
	selector: 'app-feed-post-list',
	imports: [Emptystate, PostCard, SkeletonCard, Spinner, TranslatePipe],
	templateUrl: './feed-post-list.html',
})
export class FeedPostList implements OnDestroy {
	/**
	 * Propiedad para gestionar scroll container.
	 */
	private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer')
	/**
	 * Propiedad para gestionar sentinel.
	 */
	private readonly sentinel        = viewChild<ElementRef<HTMLElement>>('sentinel')
	/**
	 * Propiedad para gestionar observer.
	 */
	private observer?: IntersectionObserver

	/**
	 * Propiedad para gestionar pull start y.
	 */
	private pullStartY = 0
	/**
	 * Propiedad para gestionar pulling.
	 */
	private pulling = false
	/**
	 * Propiedad para gestionar pull progress.
	 */
	readonly pullProgress = signal(0)
	/**
	 * Propiedad para gestionar pull triggered.
	 */
	readonly pullTriggered = signal(false)

	/**
	 * Propiedad para gestionar posts.
	 */
	posts       = input<Post[]>([])
	/**
	 * Propiedad para gestionar cargando.
	 */
	loading     = input(false)
	/**
	 * Propiedad para gestionar cargando more.
	 */
	loadingMore = input(false)
	/**
	 * Propiedad para gestionar refreshing.
	 */
	refreshing  = input(false)
	/**
	 * Indicador booleano para es o está empty.
	 */
	isEmpty     = input(false)
	/**
	 * Propiedad para gestionar error.
	 */
	error       = input<string | null>(null)
	/**
	 * Indicador booleano para tiene next page.
	 */
	hasNextPage = input(true)

	/**
	 * Propiedad para gestionar comment.
	 */
	comment = output<Post>()
	/**
	 * Propiedad para gestionar report.
	 */
	report  = output<Post>()
	/**
	 * Propiedad para gestionar share.
	 */
	share   = output<Post>()
	/**
	 * Propiedad para gestionar retry.
	 */
	retry   = output<void>()
	/**
	 * Propiedad para gestionar near end.
	 */
	nearEnd = output<void>()
	/**
	 * Propiedad para gestionar explore.
	 */
	explore = output<void>()
	/**
	 * Propiedad para gestionar refrescar.
	 */
	refresh = output<void>()

	/**
	 * Propiedad para gestionar emit explore.
	 */
	readonly emitExplore = () => this.explore.emit()

	/**
	 * Constructor de la clase o componente para inicializar dependencias.
	 */
	constructor() {
		afterNextRender(() => {
			this.setupObserver()
			this.setupPullToRefresh()
		})
	}

	/**
	 * Método para setup observer.
	 */
	private setupObserver(): void {
		const sentinel = this.sentinel()?.nativeElement
		const root     = this.scrollContainer()?.nativeElement
		if (!sentinel || !root) return

		this.observer = new IntersectionObserver(
			entries => { if (entries[0].isIntersecting) this.nearEnd.emit() },
			{ root, rootMargin: '600px' },
		)
		this.observer.observe(sentinel)
	}

	/**
	 * Método para setup pull to refrescar.
	 */
	private setupPullToRefresh(): void {
		const el = this.scrollContainer()?.nativeElement
		if (!el) return

		el.addEventListener('touchstart', (e: TouchEvent) => {
			if (el.scrollTop <= 0) {
				this.pullStartY = e.touches[0].clientY
				this.pulling = true
			}
		}, { passive: true })

		el.addEventListener('touchmove', (e: TouchEvent) => {
			if (!this.pulling || el.scrollTop > 0) {
				this.pulling = false
				this.pullProgress.set(0)
				return
			}
			const dy = e.touches[0].clientY - this.pullStartY
			if (dy > 0) {
				this.pullProgress.set(Math.min(dy / 100, 1))
				this.pullTriggered.set(dy >= 100)
			}
		}, { passive: true })

		el.addEventListener('touchend', () => {
			if (this.pullTriggered()) {
				this.refresh.emit()
			}
			this.pulling = false
			this.pullProgress.set(0)
			this.pullTriggered.set(false)
		}, { passive: true })
	}

	/**
	 * Método para scroll to top.
	 */
	scrollToTop(): void {
		this.scrollContainer()?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' })
	}

	/**
	 * Método para current scroll.
	 */
	currentScroll(): number {
		return this.scrollContainer()?.nativeElement.scrollTop ?? 0
	}

	/**
	 * Método para restore scroll.
	 */
	restoreScroll(top: number): void {
		this.scrollContainer()?.nativeElement.scrollTo({ top })
	}

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al destruir el componente para liberar recursos.
	 */
	ngOnDestroy(): void {
		this.observer?.disconnect()
	}
}
