import { NextResponse } from "next/server";
import { fetchAllJobs } from "@/lib/jobs";

export async function GET() {
  const jobs = await fetchAllJobs();
  return NextResponse.json({ jobs });
}
