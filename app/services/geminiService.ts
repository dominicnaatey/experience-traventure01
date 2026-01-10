
import { GoogleGenAI } from "@google/genai";
import { SearchResult } from "../types";

interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string };
}

export class TravelGeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "" });
  }

  async searchDestination(query: string, lat?: number, lng?: number): Promise<SearchResult> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Provide travel insights for: ${query}. Include top attractions and a summary of the vibe. If relevant, suggest specific coordinates or places.`,
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        toolConfig: lat && lng ? {
          googleSearch: {
            retrievalConfig: {
                latLng: { latitude: lat, longitude: lng }
            }
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any : undefined
      },
    });

    const text = response.text || "No information found.";
    const chunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[];
    
    const sources = chunks.map((chunk) => {
      if (chunk.web) return { web: { uri: chunk.web.uri, title: chunk.web.title } };
      if (chunk.maps) return { maps: { uri: chunk.maps.uri, title: chunk.maps.title } };
      return null;
    }).filter(Boolean) as SearchResult['sources'];

    return { text, sources };
  }

  async getItinerary(tourTitle: string, location: string, duration: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Create a professional and exciting ${duration} itinerary for a tour named "${tourTitle}" in ${location}. 
      Format it as a day-by-day guide with Morning, Afternoon, and Evening activities. 
      Use Markdown for formatting with bold headers.`,
      config: {
        temperature: 0.8,
      },
    });

    return response.text || "Itinerary generation failed.";
  }
}

export const geminiService = new TravelGeminiService();
