import { GoogleGenAI } from "@google/genai";
import { Restaurant } from "../types";

// Always initialize inside the function or exported constant to ensure it picks up env vars correctly in various environments
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using the recommended gemini-3-flash-preview
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

    // Keep payload simple to avoid 400s: structured prompt + JSON response.
    let prompt = `Find 5 popular restaurants matching "${query}". `;
    if (location) {
      prompt += `Search near coordinates: ${location.latitude}, ${location.longitude}. `;
    }
    prompt += `Return ONLY a JSON array (no markdown, no prose). Fields: "name", "cuisine", "rating" (1-5 number), "address", "priceLevel" ($, $$, or $$$).`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    // SDK returns a response object with a text() helper; older versions exposed .text directly.
    const text = response.response?.text?.() ?? (response as any).text;
    if (!text) {
      console.warn("Gemini API returned empty body");
      return [];
    }

    // Parse the JSON output
    let rawData: any;
    try {
      rawData = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse Gemini JSON", err, text);
      return [];
    }
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
