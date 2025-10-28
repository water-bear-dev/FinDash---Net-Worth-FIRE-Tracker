
import { GoogleGenAI } from "@google/genai";

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface InsightResult {
  text: string;
  sources: GroundingChunk[];
}

export const getFinancialInsights = async (prompt: string): Promise<InsightResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
    
    return { text, sources: groundingChunks };

  } catch (error) {
    console.error("Error fetching financial insights:", error);
    throw new Error("Failed to get insights from Gemini API.");
  }
};
