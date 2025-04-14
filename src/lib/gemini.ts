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

    // Define request options
    const requestOptions = {};

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
    const modelConfig = {
      model: options.modelName,
      systemInstruction: options.systemInstruction,
    };

    // Add tool configuration if it exists
    if (options.tools) {
      Object.assign(modelConfig, { tools: options.tools });
    }

    const model = genAI.getGenerativeModel(modelConfig, requestOptions);

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
      thinking: `Error processing the images: ${error.message || "Unknown error"
        }`,
      ocrText: `Error processing images. ${error.message || "Please try again."
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
      maxOutputTokens: 65536,
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
      maxOutputTokens: 65536,
    },
    chatText: prompt || "redraw this image, remove text",
    responseMimeType: "image/png",
  };

  return processWithGemini(file, apiKey, options);
};

/**
 * Translation function with mapping and relationship tables
 */
export const runGeminiTranslation = async (
  text: string,
  mappingTable: string,
  relationshipsTable: string,
  apiKey: string,
  modelName: string
): Promise<GeminiResponse> => {
  const systemInstruction = `
You are a skilled translator that uses the provided mapping table and relationships table to guide your translations.
The mapping table provides specific terms and their translations.
The relationships table describes how characters relate to each other and how they address one another.
Ensure your translation maintains the nuances of these relationships and uses the correct terms from the mapping table.
`;

  const prompt = `
# TRANSLATE: Mandarin to Vietnamese with Professional Accuracy

Translate Mandarin text into Vietnamese with complete accuracy and cultural nuance by following these comprehensive guidelines:

---

### 🔹 DELIVER precise translations that:

- CAPTURE every single word, preserving the **exact meaning, tone, and nuance** of the original
- MAINTAIN **stylistic fidelity**, including:
  - Formality level (trang trọng, suồng sã, thân mật…)
  - Emotional undertones
  - Cultural or historical references
- ENSURE **pronoun consistency** throughout (e.g. ta, ngươi, người, hắn, nàng, muội, chàng) as appropriate to character and context
- RESPECT the original **sentence structure**, but rewrite for **natural Vietnamese flow** where necessary without losing meaning

---

### 🔹 ENSURE emotional and stylistic authenticity:

- MATCH the original **emotional intensity** — never exaggerate or understate the mood
- REPLICATE the tone precisely — formal stays formal, casual stays casual
- PRESERVE **character-specific speech styles**, such as unique patterns, dialects, or quirks

---

### 🔹 HANDLE names, terms, and references as follows:

- USE **Sino-Vietnamese phonetic transcription** for common historical/cultural nouns if appropriate
- RETAIN **established translations** for character and place names
- PREFER **English equivalents** for Western mythological or biblical references
- DO NOT localize or adapt terms unless required for clarity

---

### 🔹 MAINTAIN contextual and narrative integrity:

- TRANSLATE with attention to the **broader context** — ensure meaning carries across lines and paragraphs
- PRESERVE **subtext and implication**, without adding interpretation or explanation
- DO NOT omit, simplify, or condense the content — translate **everything** as faithfully as possible
- SPLIT long or complex Chinese sentences into manageable Vietnamese ones **without altering their meaning**

---

### 🔹 RELATIONSHIPS & ADDRESS TERMS:

- PRESERVE exact **modes of address** between characters:  
  (e.g. huynh – muội, ngươi – ta, nàng – thiếp, ca – đệ…)
- DISTINGUISH between:
  - **Dialogue speech**
  - **Narration by a character**
  - **Character's internal thoughts**
- ADAPT address and tone appropriately to **each narrative layer** (dialogue, monologue, narration)

---

### 🔹 QUALITY CONTROL CHECKLIST:

- ✅ No omissions – every word is translated
- ✅ No stylistic deviation from original
- ✅ Emotional tone precisely mirrored
- ✅ Consistent vocabulary, names, and pronouns
- ✅ Cultural authenticity maintained

---

## 🔹 AFTER TRANSLATION – PROVIDE COMPLETE TERMINOLOGY MAPPING TABLES:

1. **TERM MAPPING TABLE**:
   After each translation section, include a table listing:

${mappingTable || "No mapping table provided."}

   - First include **new proper nouns or terms** introduced in the section
   - Then provide the **COMPLETE UPDATED MAPPING** including all terms from previous sections

2. **RELATIONSHIPS & ADDRESS TERMS TABLE**:
   After each translation section, also include a detailed relationships table:

${relationshipsTable || "No relationships table provided."}

TEXT TO TRANSLATE:
${text}

---

## 🔹 BEFORE TRANSLATION – REQUIRE THE FOLLOWING CONTEXT:

Before beginning the translation:

1. **CONTEXT AND REFERENCE INFORMATION**:  
   
   - Summary of the story or scene  
   - World background if relevant (historical, fantasy, modern…)

2. **ADDRESS RELATIONSHIPS**:  
   
   - Character names, their **genders**, and **relationships** with each other  
   - Specific **ways characters address each other** in:  
     - Dialogue  
     - Narration  
     - Inner thoughts

3. **STYLE & TONE OF NARRATOR**:  
   
   - E.g. omniscient formal narrator, or a character's personal internal monologue  

---
`;

  const options: GeminiOptions = {
    modelName,
    systemInstruction,
    generationConfig: {
      temperature: 0.3,
      topP: 0.95,
      topK: 32,
      maxOutputTokens: 65536,
    },
    chatText: prompt,
    responseMimeType: "text/plain",
  };

  return processMultipleWithGemini([], apiKey, options);
};

// /**
//  * Function to get mapping table with tool calling support
//  */
// export const getMappingTable = async (
//   apiKey: string,
//   modelName: string
// ): Promise<string> => {
//   const { GoogleGenerativeAI } = await import("@google/generative-ai");
//   const genAI = new GoogleGenerativeAI(apiKey);

//   const model = genAI.getGenerativeModel({
//     model: modelName,
//     tools: [{
//       functionDeclarations: [
//         {
//           name: "get_mapping_table",
//           description: "Get the current mapping table",
//           parameters: {
//             type: "object",
//             properties: {},
//             required: [],
//           },
//         } as any,
//       ],
//     }],
//   }, {});

//   try {
//     // This is a stub function - in a real implementation, you would retrieve
//     // the mapping table from your database or storage
//     // For now, we'll just return a sample mapping table
//     return "| Term / Name | Transcription | Type (Person/Place/Other) | Gender (if person) | Notes |\n|:----------- |:------------- |:------------------------- |:------------------ |:------ |";
//   } catch (error) {
//     console.error("Error getting mapping table:", error);
//     throw error;
//   }
// };

// /**
//  * Function to get relationships table with tool calling support
//  */
// export const getRelationshipsTable = async (
//   apiKey: string,
//   modelName: string
// ): Promise<string> => {
//   const { GoogleGenerativeAI } = await import("@google/generative-ai");
//   const genAI = new GoogleGenerativeAI(apiKey);

//   const model = genAI.getGenerativeModel({
//     model: modelName,
//     tools: [{
//       functionDeclarations: [
//         {
//           name: "get_relationships_table",
//           description: "Get the current relationships table",
//           parameters: {
//             type: "object",
//             properties: {},
//             required: [],
//           },
//         } as any,
//       ],
//     }],
//   }, {});

//   try {
//     // This is a stub function - in a real implementation, you would retrieve
//     // the relationships table from your database or storage
//     // For now, we'll just return a sample relationships table
//     return "| Character A | Character B | Relationship | Address Terms (A→B) | Address Terms (B→A) | Notes |\n|:----------- |:----------- |:------------ |:------------------- |:------------------- |:----- |";
//   } catch (error) {
//     console.error("Error getting relationships table:", error);
//     throw error;
//   }
// };

// /**
//  * Function to set mapping table with tool calling support
//  */
// export const setMappingTable = async (
//   mappingTable: string,
//   apiKey: string,
//   modelName: string
// ): Promise<boolean> => {
//   const { GoogleGenerativeAI } = await import("@google/generative-ai");
//   const genAI = new GoogleGenerativeAI(apiKey);

//   const model = genAI.getGenerativeModel({
//     model: modelName,
//     tools: [{
//       functionDeclarations: [
//         {
//           name: "set_mapping_table",
//           description: "Set the mapping table",
//           parameters: {
//             type: "object",
//             properties: {
//               mapping_table: {
//                 type: "string",
//                 description: "The mapping table in markdown format",
//               },
//             },
//             required: ["mapping_table"],
//           },
//         } as any,
//       ],
//     }],
//   }, {});

//   try {
//     // This is a stub function - in a real implementation, you would save
//     // the mapping table to your database or storage
//     // For now, we'll just return success
//     return true;
//   } catch (error) {
//     console.error("Error setting mapping table:", error);
//     throw error;
//   }
// };

// /**
//  * Function to set relationships table with tool calling support
//  */
// export const setRelationshipsTable = async (
//   relationshipsTable: string,
//   apiKey: string,
//   modelName: string
// ): Promise<boolean> => {
//   const { GoogleGenerativeAI } = await import("@google/generative-ai");
//   const genAI = new GoogleGenerativeAI(apiKey);

//   const model = genAI.getGenerativeModel({
//     model: modelName,
//     tools: [{
//       functionDeclarations: [
//         {
//           name: "set_relationships_table",
//           description: "Set the relationships table",
//           parameters: {
//             type: "object",
//             properties: {
//               relationships_table: {
//                 type: "string",
//                 description: "The relationships table in markdown format",
//               },
//             },
//             required: ["relationships_table"],
//           },
//         } as any,
//       ],
//     }],
//   }, {});

//   try {
//     // This is a stub function - in a real implementation, you would save
//     // the relationships table to your database or storage
//     // For now, we'll just return success
//     return true;
//   } catch (error) {
//     console.error("Error setting relationships table:", error);
//     throw error;
//   }
// };

// For backward compatibility
export const runGemini = async (
  file: File,
  apiKey: string,
  modelName: string,
  options: Omit<GeminiOptions, "modelName">
): Promise<GeminiResponse> => {
  return processWithGemini(file, apiKey, { ...options, modelName });
};
