export interface GeminiResponse {
  thinking: string;
  ocrText?: string;
  hasError: boolean;
  imageData?: string;
}
