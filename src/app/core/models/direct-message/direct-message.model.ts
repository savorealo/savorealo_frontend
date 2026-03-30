export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  mediaUrl: string | null;
  conversationId: string | null;
}
