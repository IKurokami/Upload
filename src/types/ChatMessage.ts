export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string | { content: string; imageBase64s?: string[] };
  timestamp: number;
  isEditing?: boolean;
  isProcessing?: boolean;
  files?: File[];
  imageDataUrls?: string[];
  hasError?: boolean;
  originalContent?: string;
}
