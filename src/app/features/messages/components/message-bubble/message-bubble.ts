import { NgClass } from '@angular/common'
import { Component, computed, input, output, signal } from '@angular/core'
import { MessageMarkdownPipe } from '@shared/pipes/message-markdown.pipe'
import { TruncateTextPipe } from '@shared/pipes/truncate.pipe'
import { ChatMessage, Conversation } from '../../models/messages.models'
import { SharedPostCard } from '../shared-post-card/shared-post-card'
import { SharedProfileCard } from '../shared-profile-card/shared-profile-card'

@Component({
	selector: 'app-message-bubble',
	imports: [MessageMarkdownPipe, NgClass, SharedPostCard, SharedProfileCard, TruncateTextPipe],
	templateUrl: './message-bubble.html',
})
export class MessageBubble {
	private readonly messagePreviewLimit = 420
	private readonly sharedPostToken = '__shared_post__:'
	private readonly sharedProfileToken = '__shared_profile__:'

	message = input.required<ChatMessage>()
	conversation = input.required<Conversation>()
	reply = output<ChatMessage>()
	navigateToMessage = output<string>()
	expanded = signal(false)

	readonly isMine = computed(() => this.message().sender === 'me')
	readonly sharedPostId = computed(() => this.message().sharedPostId || this.parseSharedPostId(this.message().text))
	readonly sharedPostAuthorId = computed(() => this.message().sharedPostAuthorId || this.parseSharedPostAuthorId(this.message().text))
	readonly sharedProfileId = computed(() => this.message().sharedProfileId || this.parseSharedProfileId(this.message().text))
	readonly sharedProfileUsername = computed(() => this.message().sharedProfileUsername || this.parseSharedProfileUsername(this.message().text))
	readonly hasSharedReference = computed(() => !!this.sharedPostId() || !!this.sharedProfileId() || !!this.sharedProfileUsername())
	readonly hasLongText = computed(() => (this.message().text?.length ?? 0) > this.messagePreviewLimit)
	readonly textLimit = this.messagePreviewLimit

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
