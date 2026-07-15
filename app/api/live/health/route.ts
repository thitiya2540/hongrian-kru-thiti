import { NextResponse } from "next/server";
import { getLiveSetupHealth } from "@/lib/live-setup/get-live-setup-health";

export async function GET() {
  const health = await getLiveSetupHealth();
  return NextResponse.json(health, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
