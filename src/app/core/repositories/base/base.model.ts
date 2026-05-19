export interface BaseEntity {
	id: string
}

export interface TimestampedEntity extends BaseEntity {
	createdAt: Date
	updatedAt: Date
}
