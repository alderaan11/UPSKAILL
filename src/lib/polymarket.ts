export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: number;
  endDate: string;
  active: boolean;
}

export async function fetchAIPolymarketEvents(): Promise<PolymarketEvent[]> {
  try {
    // Polymarket CLOB API — search for AI-related markets
    const res = await fetch(
      "https://gamma-api.polymarket.com/events?tag=ai&limit=10&active=true&closed=false",
      { cache: "no-store" }
    );

    if (!res.ok) return [];

    const AI_KEYWORDS = [
      "ai", "artificial intelligence", "gpt", "claude", "gemini", "llm",
      "openai", "anthropic", "deepmind", "chatgpt", "machine learning",
      "neural", "model", "agi", "robot", "autonomous", "deep learning",
    ];

    const events = await res.json();
    return (events || [])
      .filter((e: Record<string, unknown>) => {
        const title = ((e.title as string) || "").toLowerCase();
        return AI_KEYWORDS.some((kw) => title.includes(kw));
      })
      .map((e: Record<string, unknown>) => ({
        id: e.id as string,
        title: e.title as string,
        slug: e.slug as string,
        outcomes: (e.outcomes as string[]) || [],
        outcomePrices: (e.outcomePrices as string[]) || [],
        volume: (e.volume as number) || 0,
        endDate: e.endDate as string,
        active: e.active as boolean,
      }));
  } catch {
    return [];
  }
}
