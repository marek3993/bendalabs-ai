import { z } from "zod";
import { lifeError, lifeJson, loadValidatedLifeState, readLifeJson, requireLifeRequest } from "@/lib/life/api";
import { lifeAiRateMessage, LifeAiError } from "@/lib/life/assistant";
import { searchLifeRadar } from "@/lib/life/radar";
import { claimLifeAiUsage, releaseLifeAiUsage } from "@/lib/life/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const inputSchema = z.object({ query: z.string().trim().min(1).max(1000), expectedVersion: z.number().int().min(0).optional() }).strict();

export async function POST(request: Request) {
  let leaseId: string | undefined;
  try {
    const session = await requireLifeRequest(request, true);
    const input = inputSchema.parse(await readLifeJson(request, 8000));
    const current = await loadValidatedLifeState();
    if (input.expectedVersion !== undefined && input.expectedVersion !== current.version) return lifeJson({ error: "Priestor sa medzitým zmenil. Obnov ho a zopakuj vyhľadávanie." }, 409);
    const rate = await claimLifeAiUsage(session.id, "chat");
    if (!rate.allowed) {
      const response = lifeJson({ error: lifeAiRateMessage(rate.retryAfter), retryAfter: rate.retryAfter }, 429);
      response.headers.set("Retry-After", String(rate.retryAfter));
      return response;
    }
    leaseId = rate.leaseId;
    try { return lifeJson({ ...await searchLifeRadar(current.state, input.query), version: current.version }); }
    catch (error) { return lifeJson({ error: error instanceof LifeAiError ? error.message : "Radar teraz nedokončil vyhľadávanie. Nič sa neuložilo. Skús to znova." }, error instanceof LifeAiError ? error.status : 503); }
  } catch (error) { return lifeError(error); }
  finally { if (leaseId) await releaseLifeAiUsage(leaseId).catch(() => undefined); }
}
