import { lifeError, lifeJson, loadValidatedLifeState, requireLifeRequest } from "@/lib/life/api";
import { lifeAiRateMessage, LifeAiError } from "@/lib/life/assistant";
import { previewLifeImport, readLifeImportFile } from "@/lib/life/import";
import { claimLifeAiUsage, releaseLifeAiUsage } from "@/lib/life/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let leaseId: string | undefined;
  try {
    const session = await requireLifeRequest(request, true);
    const file = await readLifeImportFile(request);
    const current = await loadValidatedLifeState();
    try {
      const preview = await previewLifeImport(current.state, file, async () => {
        const rate = await claimLifeAiUsage(session.id, "import");
        if (!rate.allowed) throw new LifeAiError(lifeAiRateMessage(rate.retryAfter), 429, rate.retryAfter);
        leaseId = rate.leaseId;
      });
      return lifeJson({ ...preview, version: current.version });
    } catch (error) {
      const response = lifeJson({ error: error instanceof LifeAiError ? error.message : "AI dokument teraz nespracovalo. Nič sa neuložilo. Skús menší súbor alebo to zopakuj o chvíľu.", ...(error instanceof LifeAiError && error.retryAfter ? { retryAfter: error.retryAfter } : {}) }, error instanceof LifeAiError ? error.status : 503);
      if (error instanceof LifeAiError && error.retryAfter) response.headers.set("Retry-After", String(error.retryAfter));
      return response;
    }
  } catch (error) {
    if (error instanceof LifeAiError) return lifeJson({ error: error.message }, error.status);
    return lifeError(error);
  }
  finally { if (leaseId) await releaseLifeAiUsage(leaseId).catch(() => undefined); }
}
