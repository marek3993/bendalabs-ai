import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { normalizeAuditResult } from "@/lib/site-audit/normalize";
import { rawSiteAuditSchema, type SiteAudit } from "@/lib/site-audit/schema";

let openaiClient: OpenAI | null = null;

function getLocalizedAuditError(locale: SiteLocale, key: "missingApiKey" | "emptyAudit") {
  const messages = {
    sk: {
      missingApiKey: "Chyba OPENAI_API_KEY. Dopln ho do env pre spustenie AI auditu.",
      emptyAudit: "Model vratil prazdny audit.",
    },
    cs: {
      missingApiKey: "Chybi OPENAI_API_KEY. Dopln ho do env pro spusteni AI auditu.",
      emptyAudit: "Model vratil prazdny audit.",
    },
  } as const;

  return messages[locale][key];
}

function getOpenAIClient(locale: SiteLocale) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(getLocalizedAuditError(locale, "missingApiKey"));
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }

  return openaiClient;
}

function getLanguageDirective(locale: SiteLocale) {
  if (locale === "cs") {
    return "Vystup musi byt v cestine, prirozeny, konkretni, strucny a oprety jen o dodany summary webu.";
  }

  return "Vystup musi byt v slovencine, konkretny, prakticky a oprety len o dodany summary webu.";
}

export async function generateSiteAudit(siteSummary: string, locale: SiteLocale = "sk"): Promise<SiteAudit> {
  const client = getOpenAIClient(locale);
  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

  const response = await client.chat.completions.parse({
    model,
    temperature: 0.35,
    messages: [
      {
        role: "developer",
        content: [
          "Si senior AI product strategist a conversion consultant.",
          "Hodnotis vhodnost AI vrstvy pre rozne typy webov: marketplace, rental, financne, poistne, produktove, katalogove a service weby.",
          getLanguageDirective(locale),
          "Posudzuj najma sirku ponuky, pocet rozhodovacich vetiev, formulare, kalkulacky, filtraciu, kontaktne flowy, pravdepodobne miesta kde sa ludia stracaju a priestor na upsell alebo cross-sell.",
          "recommended_ai_type vyberaj najma z: navigator, recommender, lead qualifier, upsell assistant, alebo ich kombinacie.",
          "Score je fit_score pre vhodnost AI vrstvy na stupnici 1 az 10, kde 1 je najslabsi fit a 10 najsilnejsi fit.",
          "Slaby alebo nevhodny fit nikdy nesmie dostat vysoke score.",
          "Ak web nie je vhodny, povedz to jasne a konkretne.",
          "example_user_flows vrat presne 3.",
          "summary nech je 1 kratky odsek do 2 viet.",
        ].join(" "),
      },
      {
        role: "user",
        content: siteSummary,
      },
    ],
    response_format: zodResponseFormat(rawSiteAuditSchema, "site_audit"),
  });

  const audit = response.choices[0]?.message.parsed;

  if (!audit) {
    throw new Error(getLocalizedAuditError(locale, "emptyAudit"));
  }

  return normalizeAuditResult(audit);
}
