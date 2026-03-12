import { NextResponse } from "next/server";
import { fetchPackageReleases } from "@/lib/releases";

export const dynamic = "force-dynamic";

export async function GET() {
  const releases = await fetchPackageReleases();
  return NextResponse.json({ releases });
}
