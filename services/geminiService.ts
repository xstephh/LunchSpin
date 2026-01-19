import { Restaurant } from "../types";

// Pull the API key from the same env helper the app already uses
const getApiKey = () => process.env.API_KEY;

// Cheapest Perplexity model with web access
const MODEL_NAME = "sonar";
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

interface Coordinates {
  latitude: number;
  longitude: number;
}

export const discoverRestaurants = async (
  query: string,
  location?: Coordinates,
): Promise<Restaurant[]> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Perplexity API key missing (process.env.API_KEY).");
    return [];
  }

  try {
    let prompt = `Find 5 popular restaurants matching "${query}". `;
    if (location) {
      prompt += `Search near coordinates: ${location.latitude}, ${location.longitude}. `;
    }
    prompt += `Return ONLY a JSON array (no markdown, no prose). Each item: {"name": string, "cuisine": string, "rating": 1-5 number, "address": string, "priceLevel": "$" | "$$" | "$$$" | "$$$$"}.`;

    const body = {
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content:
            "You are a concise restaurant finder. Always respond with valid JSON only (no markdown, no commentary).",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.2,
    };

    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Perplexity API error:", response.status, errText);
      return [];
    }

    const data = await response.json();
    const text: string =
      data?.choices?.[0]?.message?.content?.trim?.() ??
      data?.choices?.[0]?.message?.content ??
      "";
    if (!text) {
      console.warn("Perplexity API returned empty content");
      return [];
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse Perplexity JSON", err, text);
      return [];
    }

    const list = Array.isArray(parsed) ? parsed : parsed.restaurants || [];

    return list.map((item: any, idx: number) => ({
      id: `px-${Date.now().toString(36)}-${idx.toString(36)}`,
      name: item.name,
      cuisine: item.cuisine || "Unknown",
      rating: item.rating || 0,
      address: item.address,
      priceLevel: item.priceLevel || "$$",
      source: "perplexity",
      googleMapsUri:
        item.googleMapsUri ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          (item.name || "") + " " + (item.address || ""),
        )}`,
    }));
  } catch (error) {
    console.error("Perplexity API Error:", error);
    return [];
  }
};
