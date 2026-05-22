import { inject, Injectable, signal } from '@angular/core'
import { Subject } from 'rxjs'
import { FeedService } from '@core/services/feed.service'
import { ToastService } from '@core/services/toast.service'

export interface LikeChanged {
	postId: string
	liked: boolean
	likesCount: number
}

export interface SaveChanged {
	postId: string
	saved: boolean
	savesCount: number
}

export interface FollowChanged {
	userId: string
	following: boolean
	requested: boolean
}

export interface CommentCountChanged {
	postId: string
	delta: number
}

interface InteractionOverride {
	liked?: boolean
	likesCount?: number
	saved?: boolean
	savesCount?: number
}

@Injectable({ providedIn: 'root' })
export class PostActionsService {
	private readonly feedService = inject(FeedService)
	private readonly toast = inject(ToastService)

	private readonly _overrides = signal(new Map<string, InteractionOverride>())
	private readonly _inFlight = new Set<string>()

	readonly likeChanged$ = new Subject<LikeChanged>()
	readonly saveChanged$ = new Subject<SaveChanged>()
	readonly followChanged$ = new Subject<FollowChanged>()
	readonly commentCountChanged$ = new Subject<CommentCountChanged>()

	isLiked(postId: string, serverValue: boolean): boolean {
		return this._overrides().get(postId)?.liked ?? serverValue
	}

	likesCount(postId: string, serverValue: number): number {
		return this._overrides().get(postId)?.likesCount ?? serverValue
	}

	isSaved(postId: string, serverValue: boolean): boolean {
		return this._overrides().get(postId)?.saved ?? serverValue
	}

	savesCount(postId: string, serverValue: number): number {
		return this._overrides().get(postId)?.savesCount ?? serverValue
	}

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

	private setOverride(postId: string, patch: InteractionOverride): void {
		this._overrides.update(m => {
			const next = new Map(m)
			next.set(postId, { ...next.get(postId), ...patch })
			return next
		})
	}

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
