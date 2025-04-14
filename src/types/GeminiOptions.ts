import { GenerationConfig } from "@google/generative-ai";

export interface GeminiOptions {
  systemInstruction: string;
  generationConfig?: GenerationConfig;
  chatText?: string;
  responseMimeType?: string;
  modelName: string;
  tools?: Tool[];
}

export interface Tool {
  functionDeclarations: FunctionDeclaration[];
}

export interface FunctionDeclaration {
  name: string;
  description?: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}
