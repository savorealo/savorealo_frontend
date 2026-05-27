import { NgClass } from '@angular/common'
import { Component, computed, input, output, signal } from '@angular/core'
import { MessageMarkdownPipe } from '@shared/pipes/message-markdown.pipe'
import { TruncateTextPipe } from '@shared/pipes/truncate.pipe'
import { ChatMessage, Conversation } from '../../models/messages.models'
import { SharedPostCard } from '../shared-post-card/shared-post-card'
import { SharedProfileCard } from '../shared-profile-card/shared-profile-card'

/**
 * Clase de utilidad para messagebubble.
 */
@Component({
	selector: 'app-message-bubble',
	imports: [MessageMarkdownPipe, NgClass, SharedPostCard, SharedProfileCard, TruncateTextPipe],
	templateUrl: './message-bubble.html',
})
export class MessageBubble {
	/**
	 * Propiedad para gestionar message preview limit.
	 */
	private readonly messagePreviewLimit = 420
	/**
	 * Propiedad para gestionar shared post token.
	 */
	private readonly sharedPostToken = '__shared_post__:'
	/**
	 * Propiedad para gestionar shared profile token.
	 */
	private readonly sharedProfileToken = '__shared_profile__:'

	/**
	 * Propiedad para gestionar message.
	 */
	message = input.required<ChatMessage>()
	/**
	 * Propiedad para gestionar conversation.
	 */
	conversation = input.required<Conversation>()
	/**
	 * Propiedad para gestionar reply.
	 */
	reply = output<ChatMessage>()
	/**
	 * Propiedad para gestionar navigate to message.
	 */
	navigateToMessage = output<string>()
	/**
	 * Propiedad para gestionar expanded.
	 */
	expanded = signal(false)

	/**
	 * Indicador booleano para es o está mis.
	 */
	readonly isMine = computed(() => this.message().sender === 'me')
	/**
	 * Propiedad para gestionar shared post identificador.
	 */
	readonly sharedPostId = computed(() => this.message().sharedPostId || this.parseSharedPostId(this.message().text))
	/**
	 * Propiedad para gestionar shared post author identificador.
	 */
	readonly sharedPostAuthorId = computed(() => this.message().sharedPostAuthorId || this.parseSharedPostAuthorId(this.message().text))
	/**
	 * Propiedad para gestionar shared profile identificador.
	 */
	readonly sharedProfileId = computed(() => this.message().sharedProfileId || this.parseSharedProfileId(this.message().text))
	/**
	 * Propiedad para gestionar shared profile nombre de usuario.
	 */
	readonly sharedProfileUsername = computed(() => this.message().sharedProfileUsername || this.parseSharedProfileUsername(this.message().text))
	/**
	 * Indicador booleano para tiene shared reference.
	 */
	readonly hasSharedReference = computed(() => !!this.sharedPostId() || !!this.sharedProfileId() || !!this.sharedProfileUsername())
	/**
	 * Indicador booleano para tiene long text.
	 */
	readonly hasLongText = computed(() => (this.message().text?.length ?? 0) > this.messagePreviewLimit)
	/**
	 * Propiedad para gestionar text limit.
	 */
	readonly textLimit = this.messagePreviewLimit

	/**
	 * Método para parse shared post identificador.
	 */
	private parseSharedPostId(text?: string): string | null {
		const clean = text ?? ''
		if (clean.startsWith(this.sharedPostToken)) {
			return clean.slice(this.sharedPostToken.length).split(/[:\s]/)[0] || null
		}

		return clean.match(/(?:^|\s)\/post\/([0-9a-fA-F-]{20,})/)?.[1] ?? null
	}

	/**
	 * Método para parse shared post author identificador.
	 */
	private parseSharedPostAuthorId(text?: string): string | null {
		const clean = text ?? ''
		if (!clean.startsWith(this.sharedPostToken)) return null
		const raw = clean.slice(this.sharedPostToken.length).split(/\s+/)[0]
		return raw.split(':')[1] || null
	}

	/**
	 * Método para parse shared profile identificador.
	 */
	private parseSharedProfileId(text?: string): string | null {
		const clean = text ?? ''
		if (!clean.startsWith(this.sharedProfileToken)) return null
		return clean.slice(this.sharedProfileToken.length).split(/[:\s]/)[0] || null
	}

	/**
	 * Método para parse shared profile nombre de usuario.
	 */
	private parseSharedProfileUsername(text?: string): string | null {
		const clean = text ?? ''
		if (clean.startsWith(this.sharedProfileToken)) {
			const raw = clean.slice(this.sharedProfileToken.length).split(/\s+/)[0]
			return raw.split(':')[1] || null
		}

		return clean.match(/(?:^|\s)\/profile\/([A-Za-z0-9_.-]+)/)?.[1] ?? null
	}
}
