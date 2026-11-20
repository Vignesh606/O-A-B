// =============================================================================
// apps/api/src/app/api/health/route.ts
// Simple health check — used by uptime monitors and load balancers.
// Returns DB connectivity status without exposing sensitive info.
// =============================================================================

export const runtime = "edge";

import { NextResponse } from "next/server";
import { getD1Binding, initDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  let dbStatus = "ok";
  let dbLatencyMs: number | null = null;

  try {
    await initDb();
    const binding = await getD1Binding();
    const dbStart = Date.now();
    await binding.prepare("SELECT 1").first();
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.0.1",
      services: {
        database: { status: dbStatus, latencyMs: dbLatencyMs },
      },
      startupMs: Date.now() - start,
    },
    { status: 200 }
  );
}
