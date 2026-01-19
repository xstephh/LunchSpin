import { GoogleGenAI } from "@google/genai";
import { Restaurant } from "../types";

/**
 * VERCEL / BROWSER COMPATIBILITY NOTE:
 * In a standard client-side app, 'process.env.API_KEY' is only available if injected during build.
 * If you are using Vite, you might need 'import.meta.env.VITE_API_KEY'.
 * This implementation checks common patterns to find the key.
 */
const getApiKey = () => {
  // Check common environment variable patterns
  return (
    (import.meta as any).env?.VITE_API_KEY ||
    (import.meta as any).env?.API_KEY ||
    process.env.API_KEY ||
    process.env.GEMINI_API_KEY
  );
};

const getAI = () => {
  const key = getApiKey();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is missing. Ensure it is set in Vercel Environment Variables.",
    );
  }
  return new GoogleGenAI({ apiKey: key });
};

// gemini-3-flash-preview is the most stable for combined JSON + Grounding tasks
const MODEL_NAME = "gemini-2.5-flash";

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
    Return ONLY the JSON array. Do not include markdown backticks like \`\`\`json.`;

    /**
     * CRITICAL FIX FOR 400 ERRORS:
     * Some regions or project types have issues with combined googleSearch + responseMimeType in specific SDK versions.
     * We will use a cleaner configuration and handle the JSON parsing manually for maximum reliability.
     */
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        // Removing responseMimeType: "application/json" and relying on strict prompting
        // can sometimes bypass 400 Invalid Argument errors if the model version in that
        // specific Vercel edge node is slightly different.
        temperature: 0.7,
        topP: 0.95,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    if (!text) return [];

    // Parse the JSON output safely, removing potential markdown wrappers
    let data: any[];
    try {
      const cleanedJson = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);
      data = Array.isArray(parsed) ? parsed : parsed.restaurants || [];
    } catch (err) {
      console.error("JSON Parse Error. Raw Text:", text);
      return [];
    }

    return data.map((item: any) => ({
      id: `gen-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || "Unknown",
      cuisine: item.cuisine || "Various",
      rating: item.rating || 4.0,
      address: item.address || "",
      priceLevel: item.priceLevel || "$$",
      source: "google",
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + " " + (item.address || ""))}`,
    }));
  } catch (error: any) {
    console.error("Gemini Request Failed:", error?.message || error);
    // Log helpful info for debugging in Vercel console
    if (error?.message?.includes("API_KEY")) {
      console.error(
        "DEBUG: API Key appears to be invalid or empty in this environment.",
      );
    }
    return [];
  }
};
