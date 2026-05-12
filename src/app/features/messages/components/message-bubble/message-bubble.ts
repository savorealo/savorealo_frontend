import { NgClass } from '@angular/common'
import { Component, computed, input } from '@angular/core'
import { ChatMessage, Conversation } from '../../models/messages.models'

@Component({
	selector: 'app-message-bubble',
	imports: [NgClass],
	templateUrl: './message-bubble.html',
})
export class MessageBubble {
	message = input.required<ChatMessage>()
	conversation = input.required<Conversation>()

	readonly isMine = computed(() => this.message().sender === 'me')
}
