import { GoogleGenAI } from "@google/genai";
import { Restaurant } from "../types";

// The SDK expects process.env.API_KEY or a direct string.
// Vercel injects environment variables into process.env at build/runtime.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using the robust gemini-3-flash-preview which handles JSON and grounding better.
const MODEL_NAME = "gemini-3-flash-preview";

interface Coordinates {
  latitude: number;
  longitude: number;
}

export const discoverRestaurants = async (
  query: string,
  location?: Coordinates,
): Promise<Restaurant[]> => {
  try {
    const ai = getAI();

    let prompt = `Find 5 popular restaurants matching "${query}". `;
    if (location) {
      prompt += `Search specifically near coordinates: ${location.latitude}, ${location.longitude}. `;
    }
    prompt += `Return the result as a raw JSON array of objects.
    Each object must have: "name", "cuisine", "rating" (number), "address", "priceLevel" ($, $$, or $$$).
    Return ONLY the JSON. No markdown backticks, no explanatory text.`;

    // Guidelines: Use ai.models.generateContent directly.
    // Do not use complex nested parts if not needed for simple text.
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        // responseMimeType: "application/json" is supported on gemini-3 models.
        responseMimeType: "application/json",
        // Adding search tool for grounding as recommended for discovery tasks.
        tools: [{ googleSearch: {} }],
      },
    });

    // Correct Method: The SDK returns a property .text, not a method .text()
    const text = response.text?.trim();
    if (!text) {
      console.warn("Gemini API returned empty text");
      return [];
    }

    // Parse the JSON output safely
    let data: any[];
    try {
      // Sometimes models might still wrap in markdown if instruction is missed, though responseMimeType usually prevents it.
      const cleanedJson = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);
      data = Array.isArray(parsed) ? parsed : parsed.restaurants || [];
    } catch (err) {
      console.error("Failed to parse Gemini JSON output:", text);
      return [];
    }

    return data.map((item: any) => ({
      id: `gen-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || "Unknown Restaurant",
      cuisine: item.cuisine || "Various",
      rating: item.rating || 0,
      address: item.address || "Address hidden",
      priceLevel: item.priceLevel || "$$",
      source: "google",
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + " " + (item.address || ""))}`,
    }));
  } catch (error: any) {
    // If we hit a 400 because of specific configuration or key issues
    console.error("Gemini API Request Failed:", error?.message || error);
    return [];
  }
};
