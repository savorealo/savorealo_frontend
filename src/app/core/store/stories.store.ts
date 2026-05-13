import { computed, inject, Injectable, signal } from '@angular/core'
import { Observable, tap, throwError } from 'rxjs'
import { finalize } from 'rxjs/operators'
import { StoriesService } from '@core/services/stories.service'
import { AuthStore } from '@core/store/auth.store'
import { StoryGroup } from '@core/models/story/story.model'

@Injectable({ providedIn: 'root' })
export class StoriesStore {
	private readonly storiesService = inject(StoriesService)
	private readonly authStore = inject(AuthStore)
	private readonly _initialized = signal(false)

	readonly groups = signal<StoryGroup[]>([])
	readonly loading = signal(false)
	readonly viewerOpen = signal(false)
	readonly activeGroupIdx = signal(0)
	readonly activeStoryIdx = signal(0)

	readonly activeGroup = computed(() => this.groups()[this.activeGroupIdx()] ?? null)
	readonly activeStory = computed(() => this.activeGroup()?.stories[this.activeStoryIdx()] ?? null)

	load(): void {
		const userId = this.authStore.currentUserId()
		if (!userId || this._initialized()) return
		this._initialized.set(true)
		this.loading.set(true)
		this.storiesService.getStories(userId).pipe(
			finalize(() => this.loading.set(false)),
		).subscribe({
			next: groups => this.groups.set(groups),
			error: () => {
				this._initialized.set(false)
			},
		})
	}

	openViewer(groupIdx: number): void {
		this.activeGroupIdx.set(groupIdx)
		this.activeStoryIdx.set(0)
		this.viewerOpen.set(true)
		this._markCurrentViewed()
	}

	closeViewer(): void {
		this.viewerOpen.set(false)
	}

	nextStory(): void {
		const group = this.activeGroup()
		if (!group) return
		if (this.activeStoryIdx() < group.stories.length - 1) {
			this.activeStoryIdx.update(i => i + 1)
			this._markCurrentViewed()
		} else if (this.activeGroupIdx() < this.groups().length - 1) {
			this.activeGroupIdx.update(i => i + 1)
			this.activeStoryIdx.set(0)
			this._markCurrentViewed()
		} else {
			this.closeViewer()
		}
	}

	prevStory(): void {
		if (this.activeStoryIdx() > 0) {
			this.activeStoryIdx.update(i => i - 1)
			this._markCurrentViewed()
		} else if (this.activeGroupIdx() > 0) {
			this.activeGroupIdx.update(i => i - 1)
			const prevGroup = this.activeGroup()
			this.activeStoryIdx.set(prevGroup ? prevGroup.stories.length - 1 : 0)
			this._markCurrentViewed()
		}
	}

	addStory(file: File): Observable<void> {
		const userId = this.authStore.currentUserId()
		if (!userId) return throwError(() => new Error('No hay sesión'))
		return this.storiesService.createStory(userId, file).pipe(
			tap(() => {
				this._initialized.set(false)
				this.load()
			}),
		)
	}

	private _markCurrentViewed(): void {
		const story = this.activeStory()
		const userId = this.authStore.currentUserId()
		if (!story || !userId || story.viewed) return

		this.groups.update(groups => groups.map(g => ({
			...g,
			stories: g.stories.map(s => s.id === story.id ? { ...s, viewed: true } : s),
			hasUnviewed: g.stories.some(s => s.id !== story.id && !s.viewed),
		})))

		this.storiesService.markViewed(story.id, userId).subscribe()
	}
}
