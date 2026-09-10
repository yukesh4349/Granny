// ============================================================================
// Memory DTOs
// ============================================================================
export class CreateMemoryDto {
  type: string;  // "fact" | "anecdote" | "photo" | "routine"
  title?: string;
  content: string;
  tags?: string[];
  imageUrl?: string;
}

export class SearchMemoryDto {
  query: string;
  limit?: number;
}
