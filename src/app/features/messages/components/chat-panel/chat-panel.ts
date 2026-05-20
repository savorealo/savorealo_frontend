import { Component, input, output, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { MessageBubble } from '../message-bubble/message-bubble'
import { ChatMessage, Conversation } from '../../models/messages.models'
import { SavoLoader } from '@shared/components/savo-loader/savo-loader'

@Component({
	selector: 'app-chat-panel',
	imports: [MessageBubble, RouterLink, SavoLoader],
	templateUrl: './chat-panel.html',
})
export class ChatPanel {
	conversation = input.required<Conversation>()
	messages     = input.required<ChatMessage[]>()
	loading      = input(false)
	isTyping     = input(false)

	sendMessage = output<string>()
	typing      = output<void>()
	startCall   = output<'audio' | 'video'>()
	back        = output<void>()

	readonly draft = signal('')
	readonly menuOpen = signal(false)

	setDraft(event: Event): void {
		const value = (event.target as HTMLInputElement).value
		this.draft.set(value)
		if (value.trim()) this.typing.emit()
	}

	send(): void {
		const text = this.draft().trim()
		if (!text) return
		this.sendMessage.emit(text)
		this.draft.set('')
	}

	toggleMenu(): void {
		this.menuOpen.update(v => !v)
	}

	callFromMenu(type: 'audio' | 'video'): void {
		this.menuOpen.set(false)
		this.startCall.emit(type)
	}
}
