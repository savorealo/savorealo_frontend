import { Component, effect, inject, signal } from '@angular/core'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { ActivatedRoute } from '@angular/router'
import { ConversationList } from './components/conversation-list/conversation-list'
import { ChatPanel } from './components/chat-panel/chat-panel'
import { NewConversation } from './components/new-conversation/new-conversation'
import { SavoLoader } from '@shared/components/savo-loader/savo-loader'
import { MessagesStore } from '@core/store/messages.store'
import { CallStore } from '@core/store/call.store'
import { AuthStore } from '@core/store/auth.store'

import { TranslatePipe } from '@shared/pipes/translate.pipe'

@Component({
	selector: 'app-messages-page',
	imports: [AppShell, ConversationList, ChatPanel, NewConversation, SavoLoader, TranslatePipe],
	templateUrl: './messages-page.html',
})
export class MessagesPage {
	readonly store        = inject(MessagesStore)
	readonly callStore    = inject(CallStore)
	private readonly auth = inject(AuthStore)
	private readonly route = inject(ActivatedRoute)
	readonly showCompose  = signal(false)
	private hasLoaded = false

	constructor() {
		effect(() => {
			const uid = this.auth.currentUserId()
			if (uid && !this.hasLoaded) {
				this.hasLoaded = true
				const requestedUserId = this.route.snapshot.queryParamMap.get('with')
				if (requestedUserId && requestedUserId !== uid) {
					this.store.openOrCreateWith(requestedUserId)
				} else {
					this.store.loadConversations()
				}
			}
		})

		effect(() => {
			this.store.conversations().forEach(c => this.callStore.subscribeForConversation(c.id))
		})
	}

	onStartCall(type: 'audio' | 'video'): void {
		const conv = this.store.activeConversation()
		if (!conv) return
		this.callStore.initiateCall(conv.id, conv.user.id, conv.user.name, conv.user.avatarUrl ?? '', type === 'video')
	}
}
