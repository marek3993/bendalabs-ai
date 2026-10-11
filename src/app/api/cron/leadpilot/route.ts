import { timingSafeEqual } from "node:crypto";
import { runScout } from "@/lib/leadpilot/scout";
import { isScheduledScoutTime, scoutScheduleConfigured } from "@/lib/leadpilot/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function json(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return json({ skipped: true, reason: "non-production" });
  }
  if (!scoutScheduleConfigured()) return json({ skipped: true, reason: "schedule-disabled" });
  const now = new Date();
  if (!isScheduledScoutTime(now)) return json({ skipped: true, reason: "outside-scheduled-time" });
  try {
    const run = await runScout(now);
    // Return operational counts only, never lead content or credentials.
    return json({ run_key: run.run_key, status: run.status, found: run.found, saved: run.saved,
      skipped: run.skipped, reused: run.reused, error_count: run.errors.length }, run.status === "failed" ? 503 : 200);
  } catch {
    console.error("Scheduled LeadPilot run failed.");
    return json({ error: "LeadPilot run failed" }, 503);
  }
}
