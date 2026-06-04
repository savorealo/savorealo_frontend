import { inject, Injectable, signal } from '@angular/core'
import { Subject } from 'rxjs'
import { FeedService } from '@core/services/feed.service'
import { ToastService } from '@core/services/toast.service'

/**
 * Interfaz que define la estructura o contrato de datos para likechanged.
 */
export interface LikeChanged {
	/**
	 * Propiedad para gestionar post identificador.
	 */
	postId: string
	/**
	 * Propiedad para gestionar liked.
	 */
	liked: boolean
	/**
	 * Propiedad para gestionar likes cantidad.
	 */
	likesCount: number
}

/**
 * Interfaz que define la estructura o contrato de datos para savechanged.
 */
export interface SaveChanged {
	/**
	 * Propiedad para gestionar post identificador.
	 */
	postId: string
	/**
	 * Propiedad para gestionar saved.
	 */
	saved: boolean
	/**
	 * Propiedad para gestionar saves cantidad.
	 */
	savesCount: number
}

/**
 * Interfaz que define la estructura o contrato de datos para followchanged.
 */
export interface FollowChanged {
	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId: string
	/**
	 * Propiedad para gestionar following.
	 */
	following: boolean
	/**
	 * Propiedad para gestionar requested.
	 */
	requested: boolean
}

/**
 * Interfaz que define la estructura o contrato de datos para commentcountchanged.
 */
export interface CommentCountChanged {
	/**
	 * Propiedad para gestionar post identificador.
	 */
	postId: string
	/**
	 * Propiedad para gestionar delta.
	 */
	delta: number
}

/**
 * Interfaz que define la estructura o contrato de datos para interactionoverride.
 */
interface InteractionOverride {
	/**
	 * Propiedad para gestionar liked.
	 */
	liked?: boolean
	/**
	 * Propiedad para gestionar likes cantidad.
	 */
	likesCount?: number
	/**
	 * Propiedad para gestionar saved.
	 */
	saved?: boolean
	/**
	 * Propiedad para gestionar saves cantidad.
	 */
	savesCount?: number
}

/**
 * Servicio que provee la lógica de negocio para postactions.
 */
@Injectable({ providedIn: 'root' })
export class PostActionsService {
	/**
	 * Propiedad para gestionar feed service.
	 */
	private readonly feedService = inject(FeedService)
	/**
	 * Propiedad para gestionar toast.
	 */
	private readonly toast = inject(ToastService)

	/**
	 * Propiedad para gestionar overrides.
	 */
	private readonly _overrides = signal(new Map<string, InteractionOverride>())
	/**
	 * Propiedad para gestionar en vuelo/curso.
	 */
	private readonly _inFlight = new Set<string>()

	/**
	 * Propiedad para gestionar like changed$.
	 */
	readonly likeChanged$ = new Subject<LikeChanged>()
	/**
	 * Propiedad para gestionar guardar changed$.
	 */
	readonly saveChanged$ = new Subject<SaveChanged>()
	/**
	 * Propiedad para gestionar follow changed$.
	 */
	readonly followChanged$ = new Subject<FollowChanged>()
	/**
	 * Propiedad para gestionar comment cantidad changed$.
	 */
	readonly commentCountChanged$ = new Subject<CommentCountChanged>()

	/**
	 * Método para es o está liked.
	 */
	isLiked(postId: string, serverValue: boolean): boolean {
		return this._overrides().get(postId)?.liked ?? serverValue
	}

	/**
	 * Método para likes cantidad.
	 */
	likesCount(postId: string, serverValue: number): number {
		return this._overrides().get(postId)?.likesCount ?? serverValue
	}

	/**
	 * Método para es o está saved.
	 */
	isSaved(postId: string, serverValue: boolean): boolean {
		return this._overrides().get(postId)?.saved ?? serverValue
	}

	/**
	 * Método para saves cantidad.
	 */
	savesCount(postId: string, serverValue: number): number {
		return this._overrides().get(postId)?.savesCount ?? serverValue
	}

	/**
	 * Método para alternar like.
	 */
	toggleLike(postId: string, currentLiked: boolean, currentCount: number): void {
		const key = `like:${postId}`
		if (this._inFlight.has(key)) return
		this._inFlight.add(key)

		const liked = !currentLiked
		const likesCount = liked ? currentCount + 1 : Math.max(0, currentCount - 1)
		this.setOverride(postId, { liked, likesCount })

		this.feedService.toggleLike(postId).subscribe({
			next: result => {
				this._inFlight.delete(key)
				this.clearOverride(postId, 'liked', 'likesCount')
				this.likeChanged$.next({
					postId,
					liked: result.active,
					likesCount: this.reconciledCount(result.active, liked, result.count, currentCount, likesCount),
				})
			},
			error: () => {
				this._inFlight.delete(key)
				this.clearOverride(postId, 'liked', 'likesCount')
				this.toast.error('No se pudo dar like')
			},
		})
	}

	/**
	 * Método para alternar guardar.
	 */
	toggleSave(postId: string, currentSaved: boolean, currentCount: number): void {
		const key = `save:${postId}`
		if (this._inFlight.has(key)) return
		this._inFlight.add(key)

		const saved = !currentSaved
		const savesCount = saved ? currentCount + 1 : Math.max(0, currentCount - 1)
		this.setOverride(postId, { saved, savesCount })
		this.toast.success(saved ? 'Guardado en tu colección' : 'Eliminado de guardados', '')

		this.feedService.toggleSave(postId).subscribe({
			next: result => {
				this._inFlight.delete(key)
				this.clearOverride(postId, 'saved', 'savesCount')
				this.saveChanged$.next({
					postId,
					saved: result.active,
					savesCount: this.reconciledCount(result.active, saved, result.count, currentCount, savesCount),
				})
			},
			error: () => {
				this._inFlight.delete(key)
				this.clearOverride(postId, 'saved', 'savesCount')
				this.toast.error('No se pudo guardar')
			},
		})
	}

	/**
	 * Método para establecer override.
	 */
	private setOverride(postId: string, patch: InteractionOverride): void {
		this._overrides.update(m => {
			const next = new Map(m)
			next.set(postId, { ...next.get(postId), ...patch })
			return next
		})
	}

	/**
	 * Método para limpiar override.
	 */
	private clearOverride(postId: string, ...keys: (keyof InteractionOverride)[]): void {
		this._overrides.update(m => {
			const current = m.get(postId)
			if (!current) return m
			const next = new Map(m)
			const updated = { ...current }
			for (const k of keys) delete updated[k]
			if (Object.keys(updated).length === 0) {
				next.delete(postId)
			} else {
				next.set(postId, updated)
			}
			return next
		})
	}

	/**
	 * Método para reconciled cantidad.
	 */
	private reconciledCount(
		confirmedActive: boolean,
		optimisticActive: boolean,
		serverCount: number,
		previousCount: number,
		optimisticCount: number,
	): number {
		if (confirmedActive === optimisticActive && serverCount === previousCount) {
			return optimisticCount
		}
		return serverCount
	}
}
