import { NgOptimizedImage } from '@angular/common'
import { Component, computed, inject, input, output, signal, ViewChild } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { Post } from '@core/models/post/post.model'
import { PreferencesService } from '@core/services/preferences.service'
import { VeganConvertModal } from '@features/feed/components/vegan-convert-modal/vegan-convert-modal'
import { Avatar } from '@shared/components/avatar/avatar'
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'
import { TruncateTextPipe } from '@shared/pipes/truncate.pipe'
import { MenuItem } from 'primeng/api'
import { Menu } from 'primeng/menu'

@Component({
	selector: 'app-post-card',
	imports: [Avatar, Menu, NgOptimizedImage, RouterLink, TimeAgoPipe, TruncateTextPipe, VeganConvertModal, ImgFallbackDirective],
	templateUrl: './post-card.html',
})
export class PostCard {
	@ViewChild('optionsMenu') private optionsMenu?: Menu

	private readonly router = inject(Router)
	readonly preferences = inject(PreferencesService)

	post = input.required<Post>()
	onLike = output<Post>()
	onSave = output<Post>()
	onComment = output<Post>()
	onReport = output<Post>()

	expanded       = signal(false)
	likeAnimating  = signal(false)
	veganModalOpen = signal(false)

	primaryMedia = computed(() => this.post().media[0] ?? null)

	authorName = computed(() =>
		this.post().author.name || this.post().author.username || 'Chef anonimo',
	)

	authorHandle = computed(() =>
		this.post().author.username ? `@${this.post().author.username}` : 'savorealo',
	)

	profileLink = computed(() =>
		this.post().author.username ? ['/profile', this.post().author.username] : ['/profile'],
	)

	postLink = computed(() => ['/post', this.post().id])

	content = computed(() =>
		[this.post().title, this.post().description].filter(Boolean).join('\n\n'),
	)

	hasLongContent = computed(() => this.content().length > 96)

	menuItems = computed<MenuItem[]>(() => [
		{
			label: this.post().saved ? 'Quitar guardado' : 'Guardar',
			icon: this.post().saved ? 'pi pi-bookmark-fill' : 'pi pi-bookmark',
			command: () => this.onSave.emit(this.post()),
		},
		{
			label: 'Reportar',
			icon: 'pi pi-flag',
			command: () => this.onReport.emit(this.post()),
		},
	])

	toggleMenu(event: Event): void {
		this.optionsMenu?.toggle(event)
	}

	triggerLike(): void {
		this.likeAnimating.set(true)
		setTimeout(() => this.likeAnimating.set(false), 400)
		this.onLike.emit(this.post())
	}

	openCookingMode(): void {
		this.router.navigate(['/cook', this.post().id])
	}
}
