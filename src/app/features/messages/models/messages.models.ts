export interface MessageUser {
	id: string
	name: string
	username: string
	avatarUrl: string
	online?: boolean
	lastSeenAt?: string | null
	statusText?: string
	verified?: boolean
}

export interface Conversation {
	id: string
	user: MessageUser
	lastMessage: string
	lastMessageKind?: 'text' | 'post' | 'profile'
	lastMessageAt: string | null
	time: string
	unread: number
	group?: boolean
	typing?: boolean
}

export interface RecipeAttachment {
	title: string
	author: string
	imageUrl: string
}

export interface MessageReply {
	id: string
	senderName: string
	text: string
	isMine: boolean
}

export interface ChatMessage {
	id: string
	conversationId: string
	senderId?: string
	sender: 'me' | 'them'
	text?: string
	time?: string
	createdAt?: string
	readAt?: string | null
	deliveryStatus?: 'sent' | 'seen'
	sharedPostId?: string | null
	sharedPostAuthorId?: string | null
	sharedProfileId?: string | null
	sharedProfileUsername?: string | null
	replyToMessageId?: string | null
	replyTo?: MessageReply | null
	typing?: boolean
	attachment?: RecipeAttachment
}

export type ConversationFilter = 'all' | 'unread' | 'groups'
