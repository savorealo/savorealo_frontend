export interface SendMessageDto {
  receiverId: string;
  content: string;
  mediaUrl?: string;
  conversationId?: string;
}
