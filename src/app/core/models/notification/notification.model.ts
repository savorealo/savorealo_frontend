export interface Notification {
  id: string;
  userId: string;
  type: string;
  actorId: string | null;
  targetId: string | null;
  content: string | null;
  isRead: boolean;
  createdAt: string;
}
