export interface MessageUser {
	id: string
	name: string
	username: string
	avatarUrl: string
	online?: boolean
	verified?: boolean
}

export interface Conversation {
	id: string
	user: MessageUser
	lastMessage: string
	lastMessageAt: string | null
	time: string
	unread: number
	group?: boolean
}

export interface RecipeAttachment {
	title: string
	author: string
	imageUrl: string
}

export interface ChatMessage {
	id: string
	conversationId: string
	senderId?: string
	sender: 'me' | 'them'
	text?: string
	time?: string
	typing?: boolean
	attachment?: RecipeAttachment
}

export type ConversationFilter = 'all' | 'unread' | 'groups'
