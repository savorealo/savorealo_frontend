export interface FeedEvent {
  id: string;
  eventType: string;
  entityId: string;
  userId: string;
  actorId: string | null;
  metadata: unknown | null;
  createdAt: string;
}
