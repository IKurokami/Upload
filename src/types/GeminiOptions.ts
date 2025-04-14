import { GenerationConfig } from "@google/generative-ai";

export interface GeminiOptions {
  systemInstruction: string;
  generationConfig?: GenerationConfig;
  chatText?: string;
  responseMimeType?: string;
  modelName: string;
}
