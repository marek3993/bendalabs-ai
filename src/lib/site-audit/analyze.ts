import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { siteAuditSchema, type SiteAudit } from "@/lib/site-audit/schema";

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Chýba OPENAI_API_KEY. Doplň ho do env pre spustenie AI auditu.");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }

  return openaiClient;
}

export async function generateSiteAudit(siteSummary: string): Promise<SiteAudit> {
  const client = getOpenAIClient();
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
          "Vystup musi byt v slovencine, konkretny, prakticky a oprety len o dodany summary webu.",
          "Posudzuj najma sirku ponuky, pocet rozhodovacich vetiev, formulare, kalkulacky, filtraciu, kontaktne flowy, pravdepodobne miesta kde sa ludia stracaju a priestor na upsell alebo cross-sell.",
          "recommended_ai_type vyberaj najma z: navigator, recommender, lead qualifier, upsell assistant, alebo ich kombinacie.",
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
    response_format: zodResponseFormat(siteAuditSchema, "site_audit"),
  });

  const audit = response.choices[0]?.message.parsed;

  if (!audit) {
    throw new Error("Model vratil prazdny audit.");
  }

  return siteAuditSchema.parse(audit);
}

