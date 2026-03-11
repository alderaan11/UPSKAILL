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
      "https://gamma-api.polymarket.com/events?tag=ai&limit=20&active=true&closed=false",
      { next: { revalidate: 60 } } // cache 1 min
    );

    if (!res.ok) return [];

    const events = await res.json();
    return (events || []).map((e: Record<string, unknown>) => ({
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
