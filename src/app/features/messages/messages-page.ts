import { Component, effect, inject, OnDestroy, signal } from '@angular/core'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { ConversationList } from './components/conversation-list/conversation-list'
import { ChatPanel } from './components/chat-panel/chat-panel'
import { CallOverlay } from './components/call-overlay/call-overlay'
import { IncomingCall } from './components/incoming-call/incoming-call'
import { NewConversation } from './components/new-conversation/new-conversation'
import { SavoLoader } from '@shared/components/savo-loader/savo-loader'
import { MessagesStore } from '@core/store/messages.store'
import { CallStore } from '@core/store/call.store'
import { AuthStore } from '@core/store/auth.store'

@Component({
	selector: 'app-messages-page',
	imports: [AppShell, ConversationList, ChatPanel, CallOverlay, IncomingCall, NewConversation, SavoLoader],
	templateUrl: './messages-page.html',
})
export class MessagesPage implements OnDestroy {
	readonly store        = inject(MessagesStore)
	readonly callStore    = inject(CallStore)
	private readonly auth = inject(AuthStore)
	readonly showCompose  = signal(false)
	private hasLoaded = false

	constructor() {
		// Cargar conversaciones cuando la sesión esté lista (currentUserId pasa de null a uuid)
		effect(() => {
			const uid = this.auth.currentUserId()
			if (uid && !this.hasLoaded) {
				this.hasLoaded = true
				this.store.loadConversations()
			}
		})

		// Subscribe to call signals for each loaded conversation
		effect(() => {
			this.store.conversations().forEach(c => this.callStore.subscribeForConversation(c.id))
		})
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
