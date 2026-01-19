import { GoogleGenAI } from "@google/genai";
import { Restaurant } from "../types";

// Always initialize inside the function or exported constant to ensure it picks up env vars correctly in various environments
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using the recommended gemini-3-flash-preview
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

    // Construct tool config specifically for Google Search grounding as requested by guidelines for Gemini 3
    // gemini-3 models use googleSearch tool for grounding.
    const config: any = {
      tools: [{ googleSearch: {} }],
    };

    let prompt = `Find 5 popular restaurants matching: "${query}". `;
    if (location) {
      prompt += `Search near coordinates: ${location.latitude}, ${location.longitude}. `;
    }
    prompt += `Return the results as a JSON array with exactly these fields: "name", "cuisine", "rating" (number 1-5), "address", "priceLevel" ($, $$, or $$$). 
    Do not include any text before or after the JSON.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        ...config,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return [];

    // Parse the JSON output
    const rawData = JSON.parse(text);
    const data = Array.isArray(rawData) ? rawData : rawData.restaurants || [];

    return data.map((item: any) => ({
      id: `gen-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name,
      cuisine: item.cuisine || "Unknown",
      rating: item.rating || 0,
      address: item.address,
      priceLevel: item.priceLevel || "$$",
      source: "google",
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + " " + (item.address || ""))}`,
    }));
  } catch (error) {
    console.error("Gemini API Error details:", error);
    // Return empty array so UI doesn't crash
    return [];
  }
};
