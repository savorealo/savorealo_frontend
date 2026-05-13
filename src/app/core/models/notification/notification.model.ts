export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION' | 'RECIPE_SAVE'

export interface NotificationActor {
	id: string
	username: string | null
	fullName: string | null
	photoUrl: string | null
}

export interface Notification {
	id: string
	userId: string
	actorId: string | null
	actor: NotificationActor | null
	targetId: string | null
	type: NotificationType
	content: string | null
	isRead: boolean
	createdAt: Date
}
