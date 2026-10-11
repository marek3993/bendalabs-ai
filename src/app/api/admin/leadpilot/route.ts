import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/leads/auth";
import { leadStatuses } from "@/lib/leadpilot/model";
import { getOpportunity, listOpportunities, saveOpportunity, updateOpportunity } from "@/lib/leadpilot/repository";
import { analyzeDemand, runScout } from "@/lib/leadpilot/scout";
import { canonicalSourceUrl, fetchDemandPage } from "@/lib/leadpilot/sources";

export const runtime = "nodejs";
export const maxDuration = 300;
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("scout") }),
  z.object({ action: z.literal("import"), url: z.string().max(2000) }),
  z.object({ action: z.literal("verify"), id: z.string().uuid() }),
  z.object({ action: z.literal("update"), id: z.string().uuid(), status: z.enum(leadStatuses).optional(),
    reply_body: z.string().trim().min(10).max(12000).optional(), hourly_rate: z.number().min(1).max(1000).optional() }),
]);
export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Prihláste sa do adminu." }, { status: 401 });
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || new URL(request.url).protocol.replace(":", "");
  const host = request.headers.get("host") || new URL(request.url).host;
  if (request.headers.get("origin") !== `${protocol}://${host}`) return NextResponse.json({ error: "Neplatný pôvod požiadavky." }, { status: 403 });
  let input: unknown;
  try { const raw = await request.text(); if (raw.length > 20000) return NextResponse.json({ error: "Požiadavka je príliš dlhá." }, { status: 413 }); input = JSON.parse(raw); }
  catch { return NextResponse.json({ error: "Neplatná požiadavka." }, { status: 400 }); }
  const parsed = actionSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Skontrolujte vyplnené údaje." }, { status: 400 });
  try {
    const data = parsed.data;
    if (data.action === "scout") return NextResponse.json({ run: await runScout() });
    if (data.action === "import") {
      const url = canonicalSourceUrl(data.url);
      if (!url) return NextResponse.json({ error: "Vložte odkaz na zadanie z podporovaného dopytového portálu." }, { status: 400 });
      const duplicate = (await listOpportunities()).find(lead => lead.source_url === url);
      if (duplicate) return NextResponse.json({ lead: duplicate, duplicate: true });
      const lead = await analyzeDemand(await fetchDemandPage(url));
      if (!lead) return NextResponse.json({ error: "Zdroj nepotvrdzuje aktuálny dopyt na platenú realizáciu automatizácie." }, { status: 422 });
      return NextResponse.json({ lead: await saveOpportunity(lead) });
    }
    const lead = await getOpportunity(data.id);
    if (!lead) return NextResponse.json({ error: "Dopyt sa nenašiel." }, { status: 404 });
    if (data.action === "verify") {
      const page = await fetchDemandPage(lead.source_url);
      const normalize = (text: string) => text.replace(/\s+/g, " ").trim().toLowerCase();
      const supported = normalize(page.text).includes(normalize(lead.demand_excerpt));
      const verification = page.closed ? "closed" : supported && page.publishedAt ? "verified" : "review";
      return NextResponse.json({ lead: await updateOpportunity(lead.id, { fetched_at: new Date().toISOString(), source_text: page.text, published_at: page.publishedAt, publication_evidence: page.publicationEvidence, verification }) });
    }
    if (data.status === "won" && lead.verification !== "verified") return NextResponse.json({ error: "Najprv preverte pôvodný dopyt." }, { status: 422 });
    const proposal = lead.proposal && (data.reply_body !== undefined || data.hourly_rate !== undefined)
      ? { ...lead.proposal, ...(data.reply_body !== undefined ? { reply_body: data.reply_body } : {}), ...(data.hourly_rate !== undefined ? { hourly_rate: data.hourly_rate } : {}) } : undefined;
    return NextResponse.json({ lead: await updateOpportunity(data.id, { ...(data.status ? { status: data.status } : {}), ...(proposal ? { proposal } : {}) }) });
  } catch {
    console.error("LeadPilot operation failed.");
    return NextResponse.json({ error: "Operáciu sa nepodarilo dokončiť. Skontrolujte dostupnosť úložiska a AI vyhľadávania." }, { status: 503 });
  }
}
