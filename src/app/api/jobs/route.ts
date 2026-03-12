import { NextResponse } from "next/server";
import { fetchAllJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = await fetchAllJobs();
  return NextResponse.json({ jobs });
}
