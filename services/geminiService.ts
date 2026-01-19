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
    prompt += ` Include exact coordinates for each place: "lat" and "lng" as numbers (from the map result).`;
    prompt += ` Respond ONLY with JSON (no markdown, no prose, no code fences). Schema: [{"name": string, "cuisine": string, "rating": 1-5 number, "address": string, "priceLevel": "$" | "$$" | "$$$" | "$$$$", "mapsUrl": string, "lat": number, "lng": number, "source": "web"}].`;

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
      max_tokens: 700,
      temperature: 0.1,
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

    const text = extractJsonArray(rawText);
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
    const hasLocation = Boolean(location);
    const filtered = hasLocation
      ? list.filter((item: any) => {
          const lat = Number(item.lat);
          const lng = Number(item.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
          const distance = haversineKm(
            location!.latitude,
            location!.longitude,
            lat,
            lng,
          );
          return distance <= searchRadiusKm;
        })
      : list;

    return filtered.map((item: any, idx: number) => ({
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

const extractJsonArray = (rawText: string): string | null => {
  // Strip code fences or leading prose to keep JSON parseable
  const fenceRegex = /```[a-zA-Z]*\s*([\s\S]*?)```/;
  const fencedMatch = rawText.match(fenceRegex);
  const candidate = (fencedMatch ? fencedMatch[1] : rawText).trim();
  if (!candidate) return null;

  const start = candidate.indexOf("[");
  if (start === -1) return null;

  // Try to find a full JSON array using balanced brackets.
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < candidate.length; i += 1) {
    const ch = candidate[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }

  // If truncated, salvage up to the last complete object and close the array.
  let braceDepth = 0;
  inString = false;
  escape = false;
  let lastObjectEnd = -1;
  for (let i = start; i < candidate.length; i += 1) {
    const ch = candidate[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") braceDepth += 1;
    else if (ch === "}") {
      if (braceDepth > 0) braceDepth -= 1;
      if (braceDepth === 0) lastObjectEnd = i;
    }
  }
  if (lastObjectEnd !== -1) {
    return `${candidate.slice(start, lastObjectEnd + 1)}]`;
  }
  return null;
};

const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
};
