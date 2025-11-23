import { GoogleGenAI, Type } from "@google/genai";
import { OcrResult, OcrMode, SupportedLanguage } from "../types";

const getApiKey = () => {
  // In a real app, this would be handled via secure backend proxy or user input in a settings modal if client-side only.
  // For this demo, we assume process.env.API_KEY is available as per instructions.
  const key = process.env.API_KEY;
  if (!key) console.warn("API Key missing");
  return key;
};

export const performOcr = async (
  imageBase64: string, 
  language: SupportedLanguage = 'auto',
  mode: OcrMode = 'standard'
): Promise<OcrResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing. Please check your environment configuration.");

  const ai = new GoogleGenAI({ apiKey });

  // Choose model based on complexity needed
  // gemini-2.5-flash is excellent for speed and vision.
  // gemini-3-pro-preview for very dense/complex layouts if selected.
  const modelName = mode === 'table_focus' ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';

  // Robustly extract mime type from Data URI
  const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  // Robustly extract base64 data (handle both Data URI and raw base64)
  const base64Data = imageBase64.includes(',') 
    ? imageBase64.split(',')[1] 
    : imageBase64;

  let prompt = `Perform high-accuracy OCR on this image.
  
  Language Hint: ${language === 'auto' ? 'Detect automatically (supports Arabic/English/Mixed)' : language}.
  
  Requirements:
  1. Transcribe text exactly as it appears.
  2. Correct orientation if rotated.
  3. Handle multi-column layouts intelligently.
  4. If Arabic, ensure RTL handling is correct.
  5. Extract any tables as CSV format strings.
  6. Identify key entities (Dates, Names, IDs, Money).
  7. Provide a confidence score (0-100) for the overall legibility.
  `;
  
  // Use JSON schema for structured output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      fullText: { type: Type.STRING, description: "The complete extracted text content, preserving paragraphs." },
      language: { type: Type.STRING, description: "Detected language code (e.g., en, ar, fr)." },
      blocks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["text", "table", "header", "list"] },
            confidence: { type: Type.NUMBER, description: "Confidence score 0-100" }
          },
          required: ["text", "type", "confidence"]
        }
      },
      tables: {
        type: Type.ARRAY,
        items: { type: Type.STRING, description: "CSV representation of the table" }
      },
      entities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            label: { type: Type.STRING, description: "Entity type: DATE, PERSON, ORG, MONEY, ID" }
          }
        }
      }
    },
    required: ["fullText", "blocks"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for factual extraction
      }
    });

    const text = response.text;
    if (!text) throw new Error("Received empty response from AI model.");

    const data = JSON.parse(text);

    // Sanitize response to ensure arrays exist
    if (!data.blocks) data.blocks = [];
    if (!data.tables) data.tables = [];
    if (!data.entities) data.entities = [];

    return data as OcrResult;

  } catch (error: any) {
    console.error("OCR Service Error:", error);
    
    let userMessage = "Failed to process document.";
    
    // Attempt to extract message from error object or string
    let errorMsg = error.message || error.toString();
    try {
        // Handle case where error message is a JSON string (e.g. from API response body)
        if (errorMsg.trim().startsWith('{')) {
            const parsed = JSON.parse(errorMsg);
            if (parsed.error && parsed.error.message) {
                errorMsg = parsed.error.message;
            }
        }
    } catch (e) {
        // Ignore parsing errors
    }
    
    errorMsg = errorMsg.toLowerCase();

    if (error.status === 400 || errorMsg.includes("400") || errorMsg.includes("invalid argument")) {
      userMessage = "Invalid request. The image format might be unsupported or corrupted.";
    } else if (error.status === 401 || errorMsg.includes("401") || errorMsg.includes("api key")) {
      userMessage = "Authentication failed. Please verify the API Key.";
    } else if (error.status === 403 || errorMsg.includes("403")) {
      userMessage = "Access denied. The API key may lack permissions or quota.";
    } else if (error.status === 429 || errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("rate limit") || errorMsg.includes("exhausted")) {
      userMessage = "Service is busy (Rate Limit Exceeded). Please try again in a moment.";
    } else if (error.status >= 500 || errorMsg.includes("500") || errorMsg.includes("503") || errorMsg.includes("overloaded")) {
      userMessage = "AI Service is temporarily overloaded or unavailable. Please retry later.";
    } else if (errorMsg.includes("safety") || errorMsg.includes("blocked")) {
      userMessage = "Content was blocked by safety filters. Please try a different document.";
    } else if (errorMsg.includes("fetch failed") || errorMsg.includes("network") || errorMsg.includes("connection")) {
      userMessage = "Network error. Please check your internet connection.";
    } else {
      userMessage = `Error: ${error.message || "Unknown error occurred"}`;
    }

    throw new Error(userMessage);
  }
};