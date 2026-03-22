export interface Notification {
	id: string
	userId: string
	actorId: string | null
	targetId: string | null
	type: string
	content: string | null
	isRead: boolean
	createdAt: Date
}
