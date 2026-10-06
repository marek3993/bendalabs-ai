import { NextResponse } from "next/server";
import { z } from "zod";
import { automationModules, euro, getAutomationQuote } from "@/lib/bendalabs/automation";
import { persistContactRequest } from "@/lib/leads/repository";
import { isLeadStorageConfigured } from "@/lib/leads/supabase";
import { isLikelyContactRequestSpam } from "@/lib/leads/spam-detection";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";
import { getNormalizedDomainFromUrl } from "@/lib/leads/domain-utils";

export const runtime = "nodejs";
const shortText = z.string().trim().max(700).default("");
const schema = z.object({
  name: z.string().trim().max(120).default(""),
  email: z.string().trim().email().max(180).transform(value => value.toLowerCase()),
  business: z.string().trim().max(180).default(""),
  situation: z.string().trim().min(10).max(1200).optional(),
  website: z.string().trim().max(500).default("").refine(value => !value || Boolean(normalizeWebsiteUrl(value))),
  users: z.enum(["1–5", "6–20", "viac ako 20", "zatiaľ neviem"]).default("zatiaľ neviem"),
  modules: z.array(z.enum(["dokumenty", "prilezitosti"])).max(3).transform(value => [...new Set(value)]),
  details: z.object({ dokumenty: shortText, prilezitosti: shortText }).default({ dokumenty: "", prilezitosti: "" }),
  custom: z.string().trim().max(1200).default(""),
  company: z.string().max(200).default(""),
  campaign: z.string().max(400).default(""),
}).refine(value => Boolean(value.situation) || value.modules.length > 0 || value.custom.length >= 10, {
  message: "Vyberte službu alebo opíšte vlastnú požiadavku aspoň 10 znakmi.", path: ["modules"],
});

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 16000) {
    return NextResponse.json({ error: "Dopyt je príliš dlhý." }, { status: 413 });
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Neplatný pôvod požiadavky." }, { status: 403 });
  }
  let raw: unknown;
  try { const text = await request.text(); if (text.length > 16000) return NextResponse.json({ error: "Dopyt je príliš dlhý." }, { status: 413 }); raw = JSON.parse(text); }
  catch { return NextResponse.json({ error: "Skontrolujte vyplnené údaje." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Skontrolujte e-mail a stručný opis situácie (aspoň 10 znakov)." }, { status: 400 });
  const data = parsed.data;
  const quote = getAutomationQuote(data.modules);
  const selected = automationModules.filter(module => data.modules.includes(module.id));
  const message = data.situation ? [
    "BendaLabs — modulárna automatizácia /automatizacia",
    "Nezáväzná analýza situácie — bez objednávky realizácie",
    `Situácia: ${data.situation}`,
    `Téma: ${selected.map(module => module.title).join(", ") || "Vlastná situácia"}`,
    data.campaign ? `Kampaň: ${data.campaign}` : "",
  ].filter(Boolean).join("\n\n") : [
    "BendaLabs — modulárna automatizácia /automatizacia",
    `Firma: ${data.business}`, `Používatelia: ${data.users}`,
    `Služby: ${selected.map(module => module.title).join(", ") || "Vlastná požiadavka"}`,
    selected.length ? `Orientačná uvádzacia cena od: ${euro(quote.setup)} jednorazovo + ${euro(quote.monthly)} mesačne` : "Cena: individuálne nacenenie",
    ...selected.map(module => `${module.question}\n${data.details[module.id] || "Klient doplní pri konzultácii."}`),
    `Čo ďalšie potrebujete automatizovať?\n${data.custom || "Bez ďalšej požiadavky."}`,
    data.campaign ? `Kampaň: ${data.campaign}` : "",
  ].filter(Boolean).join("\n\n");
  const website = data.website ? normalizeWebsiteUrl(data.website)! : "";
  const payload = {
    locale: "sk" as const, name: data.name || "Záujemca", email: data.email, website, message,
    source: "contact_section" as const,
    normalizedDomain: website ? getNormalizedDomainFromUrl(website)! : data.email.split("@")[1], linkedAuditDomain: null,
  };
  if (data.company.trim() || isLikelyContactRequestSpam(payload)) return NextResponse.json({ success: true });
  if (!isLeadStorageConfigured()) return NextResponse.json({ error: "Dopyt sa nepodarilo uložiť. Napíšte na info@bendalabs.sk." }, { status: 503 });
  try {
    const saved = await persistContactRequest(request, payload);
    if (!saved) throw new Error("No saved automation request");
    return NextResponse.json({ success: true, eventId: saved.id });
  } catch {
    console.error("Automation request could not be saved.");
    return NextResponse.json({ error: "Dopyt sa nepodarilo uložiť. Skúste znova alebo napíšte na info@bendalabs.sk." }, { status: 503 });
  }
}
