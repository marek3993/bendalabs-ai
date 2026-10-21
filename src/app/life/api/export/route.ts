import { lifeError, loadValidatedLifeState, requireLifeRequest } from "@/lib/life/api";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireLifeRequest(request);
    const { state, version } = await loadValidatedLifeState();
    return new Response(JSON.stringify({ format: "si-for-me-export", exportedAt: new Date().toISOString(), version, state }, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="si-for-me-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
  } catch (error) { return lifeError(error); }
}
