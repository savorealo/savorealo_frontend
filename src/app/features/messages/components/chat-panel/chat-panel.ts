import { Component, input, output, signal } from '@angular/core'
import { MessageBubble } from '../message-bubble/message-bubble'
import { ChatMessage, Conversation } from '../../models/messages.models'

@Component({
	selector: 'app-chat-panel',
	imports: [MessageBubble],
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
}
