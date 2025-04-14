import { GeminiResponse } from "./GeminiResponse";

export interface ImageData {
  id: string;
  file: File;
  url: string;
  geminiResponse: GeminiResponse;
  hasError: boolean;
  isProcessing: boolean;
  willProcess?: boolean;
  timestamp?: number;
}
