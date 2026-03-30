export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
}
