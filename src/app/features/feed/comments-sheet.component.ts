import { Component, computed, inject, input, model } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Post } from '@core/models/post/post.model'
import { Comment } from '@core/models/post-actions/post-actions.model'
import { AuthStore } from '@core/store/auth.store'
import { CommentStore } from '@core/store/comment.store'
import { Avatar } from '@shared/components/avatar/avatar'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'
import { Drawer } from 'primeng/drawer'
import { Textarea } from 'primeng/textarea'

/**
 * Componente principal para la vista o página de commentssheet.
 */
@Component({
	selector: 'app-comments-sheet',
	imports: [Avatar, Drawer, FormsModule, Textarea, TimeAgoPipe],
	template: `
		<p-drawer
			[(visible)]="visible"
			position="bottom"
			[modal]="true"
			[dismissible]="true"
			[style]="{ height: 'min(82vh, 720px)' }"
			(onShow)="loadComments()"
		>
			<ng-template #header>
				<div class="leading-tight">
					<strong class="block text-base">Comentarios</strong>
					<span class="text-xs font-semibold text-surface-500">{{ post()?.commentsCount ?? 0 }} en este post</span>
				</div>
			</ng-template>

			<div class="grid h-full grid-rows-[1fr_auto] gap-3">
				<section class="overflow-y-auto pr-1" (scroll)="onScroll($event)">
					@if (comments.error()) {
						<p class="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{{ comments.error() }}</p>
					}

					@if (comments.loading()) {
						<div class="grid gap-3">
							@for (item of [1, 2, 3]; track item) {
								<div class="h-16 animate-pulse rounded-lg bg-surface-100"></div>
							}
						</div>
					} @else if (comments.isEmpty()) {
						<div class="grid place-items-center py-16 text-center text-sm text-surface-500">
							<span>Se el primero en comentar.</span>
						</div>
					} @else {
						<div class="grid gap-3">
							@for (comment of comments.comments(); track comment.id) {
								<article class="flex gap-3 rounded-lg bg-surface-50 p-3">
									<app-avatar [src]="comment.author.photoUrl" [name]="commentAuthorName(comment)" size="sm" />
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<strong class="truncate text-sm">{{ commentAuthorName(comment) }}</strong>
											<span class="text-xs font-semibold text-surface-500">{{ comment.createdAt | timeAgo }}</span>
										</div>
										<p class="mt-1 whitespace-pre-line text-sm leading-5 text-surface-700">{{ comment.text }}</p>
									</div>
									@if (isOwnComment(comment)) {
										<button
											type="button"
											class="grid size-8 place-items-center rounded-full text-surface-500 hover:bg-white hover:text-red-600"
											(click)="comments.deleteComment(comment)"
											aria-label="Eliminar comentario"
										>
											<i class="pi pi-trash"></i>
										</button>
									}
								</article>
							}
						</div>
					}

					@if (comments.loadingMore()) {
						<div class="mt-3 h-12 animate-pulse rounded-lg bg-surface-100"></div>
					}
				</section>

				<form class="flex gap-2 border-t border-surface-200 pt-3" (ngSubmit)="submitComment()">
					<textarea
						pTextarea
						name="comment"
						[(ngModel)]="draft"
						rows="1"
						maxlength="300"
						class="min-h-11 flex-1 resize-none rounded-lg border border-surface-200 p-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
						placeholder="Escribe un comentario..."
					></textarea>
					<button
						type="submit"
						class="grid size-11 place-items-center rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
						[disabled]="!canSubmit()"
						aria-label="Enviar comentario"
					>
						<i class="pi pi-send"></i>
					</button>
				</form>
			</div>
		</p-drawer>
	`,
})
export class CommentsSheetComponent {
	/**
	 * Propiedad para gestionar comments.
	 */
	readonly comments = inject(CommentStore)
	/**
	 * Propiedad para gestionar auth.
	 */
	private readonly auth = inject(AuthStore)

	/**
	 * Propiedad para gestionar visible.
	 */
	visible = model(false)
	/**
	 * Propiedad para gestionar post.
	 */
	post = input<Post | null>(null)
	/**
	 * Propiedad para gestionar draft.
	 */
	draft = ''

	/**
	 * Indicador booleano para puede enviar.
	 */
	canSubmit = computed(() => this.draft.trim().length > 0 && !this.comments.submitting())

	/**
	 * Método para cargar comments.
	 */
	loadComments(): void {
		const post = this.post()
		if (post) this.comments.open(post.id)
	}

	/**
	 * Método para evento de scroll.
	 */
	onScroll(event: Event): void {
		const element = event.target as HTMLElement
		if (element.scrollTop + element.clientHeight >= element.scrollHeight - 80) {
			this.comments.loadMore()
		}
	}

	/**
	 * Método para enviar comment.
	 */
	submitComment(): void {
		const text = this.draft.trim()
		if (!text) return
		this.draft = ''
		this.comments.addComment(text)
	}

	/**
	 * Método para comment author nombre.
	 */
	commentAuthorName(comment: Comment): string {
		return comment.author.name || comment.author.username || 'Chef'
	}

	/**
	 * Método para es o está own comment.
	 */
	isOwnComment(comment: Comment): boolean {
		const currentUserId = this.auth.currentUserId()
		return !!currentUserId && comment.authorId === currentUserId
	}
}
