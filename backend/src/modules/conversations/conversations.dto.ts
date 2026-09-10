// ============================================================================
// Conversation DTOs
// ============================================================================
export class SendMessageDto {
  text: string;
  audioUrl?: string;
  conversationId?: string;
}

export class ConversationResponseDto {
  reply: string;
  emotion: string;
  distressFlag: boolean;
  suggestedAction?: string;
  conversationId: string;
}
