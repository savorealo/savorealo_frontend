import { NgClass } from '@angular/common'
import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ContentTranslationService } from '@core/services/content-translation.service'
import { TranslationService } from '@core/services/translation.service'
import { MessageMarkdownPipe } from '@shared/pipes/message-markdown.pipe'
import { TranslatePipe } from '@shared/pipes/translate.pipe'
import { TruncateTextPipe } from '@shared/pipes/truncate.pipe'
import { finalize } from 'rxjs/operators'
import { ChatMessage, Conversation } from '../../models/messages.models'
import { SharedPostCard } from '../shared-post-card/shared-post-card'
import { SharedProfileCard } from '../shared-profile-card/shared-profile-card'

/**
 * Componente que representa la burbuja visual de un mensaje individual del chat.
 */
@Component({
	selector: 'app-message-bubble',
	imports: [MessageMarkdownPipe, NgClass, SharedPostCard, SharedProfileCard, TruncateTextPipe, TranslatePipe],
	templateUrl: './message-bubble.html',
})
export class MessageBubble {
	private readonly messagePreviewLimit = 420
	private readonly sharedPostToken    = '__shared_post__:'
	private readonly sharedProfileToken = '__shared_profile__:'

	message          = input.required<ChatMessage>()
	conversation     = input.required<Conversation>()
	reply            = output<ChatMessage>()
	navigateToMessage = output<string>()
	expanded         = signal(false)

	private readonly contentTranslation = inject(ContentTranslationService)
	private readonly translationService = inject(TranslationService)
	private readonly destroyRef         = inject(DestroyRef)

	/** Texto traducido del mensaje. Null cuando se muestra el original. */
	translatedText   = signal<string | null>(null)
	/** Indica si la traducción está en curso. */
	translateLoading = signal(false)
	/** Indica si la última traducción falló. */
	translateError   = signal(false)

	readonly isMine              = computed(() => this.message().sender === 'me')
	readonly sharedPostId        = computed(() => this.message().sharedPostId || this.parseSharedPostId(this.message().text))
	readonly sharedPostAuthorId  = computed(() => this.message().sharedPostAuthorId || this.parseSharedPostAuthorId(this.message().text))
	readonly sharedProfileId     = computed(() => this.message().sharedProfileId || this.parseSharedProfileId(this.message().text))
	readonly sharedProfileUsername = computed(() => this.message().sharedProfileUsername || this.parseSharedProfileUsername(this.message().text))
	readonly hasSharedReference  = computed(() => !!this.sharedPostId() || !!this.sharedProfileId() || !!this.sharedProfileUsername())
	readonly hasLongText         = computed(() => (this.message().text?.length ?? 0) > this.messagePreviewLimit)
	readonly textLimit           = this.messagePreviewLimit

	/** Texto a mostrar: traducido si está disponible, original si no. */
	readonly displayText = computed(() => this.translatedText() ?? this.message().text)
	/** Indica si el mensaje muestra la traducción. */
	readonly isTranslated = computed(() => this.translatedText() !== null)
	/** Dirección de texto del idioma activo ('rtl' para árabe). */
	readonly translationDir = computed(() =>
		this.translationService.currentLang() === 'ar' ? 'rtl' : 'ltr'
	)

	/**
	 * Alterna entre mostrar la traducción del mensaje y el texto original.
	 */
	triggerTranslate(): void {
		if (this.isTranslated()) {
			this.translatedText.set(null)
			return
		}
		const text = this.message().text
		if (!text) return
		this.translateLoading.set(true)
		this.translateError.set(false)
		this.contentTranslation.translate(text)
			.pipe(
				finalize(() => this.translateLoading.set(false)),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe({
				next: result => this.translatedText.set(result),
				error: ()     => this.translateError.set(true),
			})
	}

	private parseSharedPostId(text?: string): string | null {
		const clean = text ?? ''
		if (clean.startsWith(this.sharedPostToken)) {
			return clean.slice(this.sharedPostToken.length).split(/[:\s]/)[0] || null
		}
		return clean.match(/(?:^|\s)\/post\/([0-9a-fA-F-]{20,})/)?.[1] ?? null
	}

	private parseSharedPostAuthorId(text?: string): string | null {
		const clean = text ?? ''
		if (!clean.startsWith(this.sharedPostToken)) return null
		const raw = clean.slice(this.sharedPostToken.length).split(/\s+/)[0]
		return raw.split(':')[1] || null
	}

	private parseSharedProfileId(text?: string): string | null {
		const clean = text ?? ''
		if (!clean.startsWith(this.sharedProfileToken)) return null
		return clean.slice(this.sharedProfileToken.length).split(/[:\s]/)[0] || null
	}

	private parseSharedProfileUsername(text?: string): string | null {
		const clean = text ?? ''
		if (clean.startsWith(this.sharedProfileToken)) {
			const raw = clean.slice(this.sharedProfileToken.length).split(/\s+/)[0]
			return raw.split(':')[1] || null
		}
		return clean.match(/(?:^|\s)\/profile\/([A-Za-z0-9_.-]+)/)?.[1] ?? null
	}
}
