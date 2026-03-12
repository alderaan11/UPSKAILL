import { fetchLBBCompanies } from "@/lib/lbb";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "48.8566");
  const lon = parseFloat(searchParams.get("lon") ?? "2.3522");
  const distance = parseInt(searchParams.get("distance") ?? "30", 10);

  const companies = await fetchLBBCompanies(lat, lon, distance);
  return Response.json({ companies });
}
