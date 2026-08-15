/**
 * Google Places "Find businesses" prospecting helper.
 * Uses the Places API (New) Text Search so the key stays server-side.
 * Configure GOOGLE_PLACES_API_KEY in environment variables to enable.
 */

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

export interface ProspectResult {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  totalRatings: number | null;
  phone: string;
  website: string;
  types: string[];
}

export function prospectingConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY);
}

export async function searchBusinesses(query: string, location?: string): Promise<{ results: ProspectResult[]; error?: string }> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return {
      results: [],
      error: "Google Places API is not configured. Set GOOGLE_PLACES_API_KEY in Vercel environment variables (https://console.cloud.google.com/apis/library/places-backend.googleapis.com).",
    };
  }
  const q = String(query || "").trim();
  if (!q) return { results: [], error: "Enter a search query (e.g. 'gyms in Indore' or 'restaurants in Mumbai')." };
  const textQuery = location ? `${q} near ${location}` : q;

  try {
    const body: Record<string, any> = {
      textQuery,
      // Primary phone + website + ratings come from the primary display fields
    };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.websiteUri,places.types",
    };
    const res = await fetch(PLACES_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      return { results: [], error: data?.error?.message || `HTTP ${res.status}` };
    }
    const places: any[] = Array.isArray(data.places) ? data.places : [];
    const results: ProspectResult[] = places
      .filter((p) => p?.displayName?.text || p?.formattedAddress)
      .map((p) => ({
        id: p.id || "",
        name: p.displayName?.text || p.formattedAddress || "Business",
        address: p.formattedAddress || "",
        rating: typeof p.rating === "number" ? Math.round(p.rating * 10) / 10 : null,
        totalRatings: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
        phone: p.internationalPhoneNumber || "",
        website: p.websiteUri || "",
        types: Array.isArray(p.types) ? p.types : [],
      }))
      .slice(0, 40);
    return { results };
  } catch (err) {
    return { results: [], error: err instanceof Error ? err.message : "Places request failed" };
  }
}
