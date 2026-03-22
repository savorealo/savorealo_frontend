// src/app/features/messages/models/message.model.ts

export interface Conversation {
	id: string
	participant1Id: string
	participant2Id: string
	lastMessageAt: Date | null
	lastMessagePreview: string | null
	createdAt: Date
}

export interface DirectMessage {
	id: string
	senderId: string
	receiverId: string
	conversationId: string | null
	content: string
	mediaUrl: string | null
	readAt: Date | null
	createdAt: Date
}

export interface Contact {
	id: string
	userId: string
	contactUserId: string
	createdAt: Date
}
