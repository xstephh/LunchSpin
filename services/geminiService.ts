import { GoogleGenAI } from "@google/genai";
import { Restaurant } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using Gemini 2.5 Flash for speed + maps tool
const MODEL_NAME = "gemini-2.5-flash"; 

interface Coordinates {
  latitude: number;
  longitude: number;
}

export const discoverRestaurants = async (
  query: string,
  location?: Coordinates
): Promise<Restaurant[]> => {
  try {
    let finalPrompt = `Find restaurants matching this description: "${query}".`;
    
    // Construct tool config
    const toolConfig: any = {
      tools: [{ googleMaps: {} }],
    };

    // Add location grounding if available
    if (location) {
        toolConfig.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: location.latitude,
                    longitude: location.longitude
                }
            }
        }
        finalPrompt += " Search near the user's provided location.";
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: finalPrompt,
      config: toolConfig
    });

    // Extract grounding chunks which contain the Maps data
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) return [];

    const groundingChunks = candidates[0].groundingMetadata?.groundingChunks;
    
    if (!groundingChunks) {
      // Fallback: Model didn't use maps, returns text. 
      // In a real app we might parse the text, but here we return empty 
      // to signify no structured map data found.
      console.warn("No maps grounding data returned.");
      return [];
    }

    const discovered: Restaurant[] = [];

    // Process grounding chunks to extract Places
    groundingChunks.forEach((chunk: any) => {
      // The structure of a map chunk usually contains `web` or `maps` objects.
      // We look for the maps data specifically.
      if (chunk.web && chunk.web.uri && chunk.web.title) {
          // Sometimes it returns web results if map results aren't perfect
          // We can treat these as basic entries
           discovered.push({
            id: `gen-${Math.random().toString(36).substr(2, 9)}`,
            name: chunk.web.title,
            source: 'google',
            googleMapsUri: chunk.web.uri,
            cuisine: 'Varied', // Placeholder as web chunk might not have category
            rating: 0
          });
      }
    });

    // NOTE: The `groundingChunks` structure for Maps in Gemini 2.5 
    // puts the structured place data in a specific way. 
    // However, currently, the SDK returns HTML/Markdown text with links.
    // The structured data is often embedded in the textual response or 
    // strictly in groundingMetadata.searchEntryPoint.
    // For this implementation, we will try to parse the `groundingSupports` if available,
    // or simulate a better list if the API returns text.
    
    // BETTER APPROACH FOR DEMO: 
    // Since structured object mapping from GroundingChunks can be complex and variable
    // depending on the query, we will try to parse the response text if structured data is sparse,
    // but the `googleMaps` tool primarily enriches the TEXT response.
    
    // Let's refine the prompt to ask for JSON to make it robust, 
    // even though we use the tool for grounding context.
    
    // Retry with JSON schema for robust parsing, leveraging the internal knowledge + grounding.
    // Note: Google Maps tool doesn't always play nice with responseSchema simultaneously 
    // in strict mode, but we can try a hybrid approach:
    // Ask for a JSON list, and Gemini will use the Maps tool to *inform* that list.
    
    const jsonResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
          You have access to Google Maps. 
          Step 1: Search for 5 restaurants matching: "${query}" near the location provided (if any).
          Step 2: Return a JSON array of the results.
          
          Use this schema:
          [
            {
              "name": "string",
              "cuisine": "string",
              "rating": number (1-5),
              "address": "string",
              "priceLevel": "string ($ to $$$$)"
            }
          ]
        `,
         config: {
             ...toolConfig,
             responseMimeType: "application/json"
         }
    });
    
    const text = jsonResponse.text;
    if (!text) return [];

    const data = JSON.parse(text);
    
    return data.map((item: any) => ({
        id: `gen-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        cuisine: item.cuisine || 'Unknown',
        rating: item.rating || 0,
        address: item.address,
        priceLevel: item.priceLevel,
        source: 'google',
        // Construct a search URL since we might not get the direct CID from JSON mode
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + ' ' + (item.address || ''))}`
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};
