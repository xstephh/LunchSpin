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
    const searchRadiusKm = 10;
    let prompt = `Run a web/local search for real restaurants (no fabrications). Find 5 restaurants for "${query}".`;
    if (location) {
      prompt += ` Only include results within ${searchRadiusKm} km of ${location.latitude}, ${location.longitude}. Use the coordinates even if the text query is vague.`;
    } else {
      prompt += ` If no coordinates are provided, infer the area from the query text and use web search results for that area.`;
    }
    prompt += ` Each restaurant MUST exist in reality and include a working Google Maps URL (or official map URL) that opens the place.`;
    prompt += ` Respond ONLY with JSON (no markdown, no prose, no code fences). Schema: [{"name": string, "cuisine": string, "rating": 1-5 number, "address": string, "priceLevel": "$" | "$$" | "$$$" | "$$$$", "mapsUrl": string, "source": "web"}].`;

    const body = {
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content:
            "You are a grounded restaurant finder. Always use live web search results; do not invent places. Return valid JSON only (no markdown, no commentary, no code fences).",
        },
        { role: "user", content: prompt },
      ],
      return_citations: true,
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
    const rawText: string =
      data?.choices?.[0]?.message?.content?.trim?.() ??
      data?.choices?.[0]?.message?.content ??
      "";
    if (!rawText) {
      console.warn("Perplexity API returned empty content");
      return [];
    }

    // Strip code fences or leading prose to keep JSON parseable
    const fenceRegex = /```[a-zA-Z]*\s*([\s\S]*?)```/;
    const fencedMatch = rawText.match(fenceRegex);
    const text = (fencedMatch ? fencedMatch[1] : rawText).trim();
    if (!text) {
      console.warn("Perplexity API returned empty content");
      return [];
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      // Fallback: try to extract JSON array substring if code fences or prose slipped through
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(text.substring(start, end + 1));
        } catch (err2) {
          console.error("Failed to parse Perplexity JSON", err2, text);
          return [];
        }
      } else {
        console.error("Failed to parse Perplexity JSON", err, text);
        return [];
      }
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
        item.mapsUrl ||
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
