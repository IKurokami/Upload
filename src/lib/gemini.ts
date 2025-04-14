import { GeminiOptions } from "@/types/GeminiOptions";
import { GeminiResponse } from "@/types/GeminiResponse";
import {
  Content,
  HarmBlockThreshold,
  HarmCategory,
  SafetySetting,
  Part,
} from "@google/generative-ai";
import { Buffer } from "buffer";

// Add Buffer to window if in browser environment
if (typeof window !== "undefined" && !window.Buffer) {
  window.Buffer = Buffer;
}

/**
 * Core function to handle multiple file uploads and Gemini API interactions
 */
export const processMultipleWithGemini = async (
  files: File[],
  apiKey: string,
  options: GeminiOptions
): Promise<GeminiResponse> => {
  try {
    // Dynamically import required modules
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const { GoogleAIFileManager } = await import(
      "@google/generative-ai/server"
    );

    // Initialize Gemini and file manager
    const genAI = new GoogleGenerativeAI(apiKey);
    const fileManager = new GoogleAIFileManager(apiKey);

    const safetySettings: SafetySetting[] = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];

    // Upload files sequentially (one by one)
    const uploadedFiles = [];
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const uploadResult = await fileManager.uploadFile(Buffer.from(buffer), {
        mimeType: file.type,
        displayName: file.name,
      });
      uploadedFiles.push({
        file: uploadResult.file,
        originalFile: file,
      });
    }

    // Get the model with configuration
    const model = genAI.getGenerativeModel({
      model: options.modelName,
      systemInstruction: options.systemInstruction,
    });

    // Create user message parts with all files
    const fileDataParts: Part[] = uploadedFiles.map(
      ({ file, originalFile }) => ({
        fileData: {
          mimeType: originalFile.type,
          fileUri: file.uri,
        },
      })
    );

    // Create the final parts array
    const userParts: Part[] = [...fileDataParts];

    // Add text content if provided
    if (options.chatText) {
      userParts.push({ text: options.chatText });
    }

    // Create chat session with history
    const history: Content[] = [
      {
        role: "model",
        parts: [{ text: options.systemInstruction }],
      },
      {
        role: "user",
        parts: userParts,
      },
    ];

    const result = await model.generateContent({
      safetySettings: safetySettings,
      contents: history,
      generationConfig: {
        ...options.generationConfig,
        responseMimeType: options.responseMimeType || "text/plain",
      },
    });

    return processResponse(result.response);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return {
      thinking: `Error processing the images: ${
        error.message || "Unknown error"
      }`,
      ocrText: `Error processing images. ${
        error.message || "Please try again."
      }`,
      hasError: true,
    };
  }
};

/**
 * Core function to handle single file uploads and Gemini API interactions
 */
export const processWithGemini = async (
  file: File,
  apiKey: string,
  options: GeminiOptions
): Promise<GeminiResponse> => {
  return processMultipleWithGemini([file], apiKey, options);
};

/**
 * Helper function to process response from Gemini
 */
function processResponse(response: any): GeminiResponse {
  if (
    response.candidates &&
    response.candidates.length > 0 &&
    response.candidates[0].content.parts[0]?.inlineData
  ) {
    // Image response
    const inlineData = response.candidates[0].content.parts[0].inlineData;
    const imageData = `data:${inlineData.mimeType};base64,${inlineData.data}`;
    return {
      thinking: "Image processed successfully.",
      hasError: false,
      imageData,
    };
  } else if (response.text && response.text()) {
    // Text response
    return {
      thinking: "Text processed successfully.",
      ocrText: response.text(),
      hasError: false,
    };
  } else {
    // No valid response
    return {
      thinking: "No output generated.",
      ocrText: "No output generated.",
      hasError: true,
    };
  }
}

/**
 * OCR function to extract text from multiple images
 */
export const runGeminiMultiOCR = async (
  files: File[],
  apiKey: string,
  modelName: string,
  customSystemInstruction?: string | undefined,
  chatText?: string
): Promise<GeminiResponse> => {
  const defaultSystemInstruction =
    "The user wants me to extract text from the image(s) and present it as a single line of text for each dialogue bubble.\n" +
    "I need to identify the dialogue bubbles in the image(s) and then use OCR to extract the text from each bubble.\n" +
    "I must ensure the extracted text does not include watermarks like 'Colamanga.com' or 'AcloudMerge.com'.\n\n" +
    "I must identify and extract each dialogue bubble's text as a single continuous line, even if it has multiple lines inside one bubble.\n" +
    "I must present the extracted text exactly as requested by the user—just the text, with no additional formatting or descriptions. Just text. Everything answer to user is the text inside the image.\n\n\n";

  const options: GeminiOptions = {
    modelName,
    systemInstruction: customSystemInstruction || defaultSystemInstruction,
    generationConfig: {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 65536,
    },
    chatText: chatText || "",
    responseMimeType: "text/plain",
  };

  return processMultipleWithGemini(files, apiKey, options);
};

/**
 * OCR function to extract text from a single image
 */
export const runGeminiOCR = async (
  file: File,
  apiKey: string,
  modelName: string,
  customSystemInstruction?: string | undefined
): Promise<GeminiResponse> => {
  return runGeminiMultiOCR([file], apiKey, modelName, customSystemInstruction);
};

/**
 * Chat function to process text and images
 */
export const runGeminiChat = async (
  files: File[],
  chatText: string,
  apiKey: string,
  modelName: string
): Promise<GeminiResponse> => {
  const systemInstruction =
    "You are a helpful assistant that responds to user queries with text, images, or both. " +
    "If the user provides images, analyze them and respond to any questions about them. " +
    "If the user provides only text, respond to their questions or statements appropriately. " +
    "Be concise, helpful, and direct in your responses.";

  const options: GeminiOptions = {
    modelName,
    systemInstruction,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 32,
      maxOutputTokens: 4096,
    },
    chatText,
    responseMimeType: "text/plain",
  };

  return processMultipleWithGemini(files, apiKey, options);
};

/**
 * Image redrawing function
 */
export const runGeminiRedraw = async (
  file: File,
  apiKey: string,
  prompt: string
): Promise<GeminiResponse> => {
  const options: GeminiOptions = {
    modelName: "gemini-2.0-flash-exp-image-generation",
    systemInstruction:
      "You are an image redrawing assistant. Redraw the provided image, maintaining the original style and content as closely as possible.",
    generationConfig: {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
    chatText: prompt || "redraw this image, remove text",
    responseMimeType: "image/png",
  };

  return processWithGemini(file, apiKey, options);
};

// For backward compatibility
export const runGemini = async (
  file: File,
  apiKey: string,
  modelName: string,
  options: Omit<GeminiOptions, "modelName">
): Promise<GeminiResponse> => {
  return processWithGemini(file, apiKey, { ...options, modelName });
};
