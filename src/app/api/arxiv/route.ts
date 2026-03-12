import { NextResponse } from "next/server";
import { fetchArxivPapers } from "@/lib/arxiv";

export const dynamic = "force-dynamic";

export async function GET() {
  const papers = await fetchArxivPapers();
  return NextResponse.json({ papers });
}
