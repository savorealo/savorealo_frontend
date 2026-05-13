import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { MessagesTopbar } from './components/messages-topbar/messages-topbar'
import { ConversationList } from './components/conversation-list/conversation-list'
import { ChatPanel } from './components/chat-panel/chat-panel'
import { CallOverlay } from './components/call-overlay/call-overlay'
import { IncomingCall } from './components/incoming-call/incoming-call'
import { NewConversation } from './components/new-conversation/new-conversation'
import { MessagesStore } from '@core/store/messages.store'
import { CallStore } from '@core/store/call.store'

@Component({
	selector: 'app-messages-page',
	imports: [AppShell, MessagesTopbar, ConversationList, ChatPanel, CallOverlay, IncomingCall, NewConversation],
	templateUrl: './messages-page.html',
})
export class MessagesPage implements OnInit, OnDestroy {
	readonly store        = inject(MessagesStore)
	readonly callStore    = inject(CallStore)
	readonly showCompose  = signal(false)

	constructor() {
		// Subscribe to call signals for each loaded conversation
		effect(() => {
			this.store.conversations().forEach(c => this.callStore.subscribeForConversation(c.id))
		})
	}

	ngOnInit(): void {
		this.store.loadConversations()
	}

	ngOnDestroy(): void {
		this.callStore.unsubscribeAll()
	}

	onStartCall(type: 'audio' | 'video'): void {
		const conv = this.store.activeConversation()
		if (!conv) return
		this.callStore.initiateCall(conv.id, conv.user.id, conv.user.name, conv.user.avatarUrl, type === 'video')
	}
}
