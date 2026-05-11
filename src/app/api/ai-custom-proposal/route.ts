import { NextResponse } from "next/server";
import {
  AI_CUSTOM_PROPOSAL_SOURCE,
  buildAiCustomProposalLeadMessage,
  generateAiCustomProposalRecommendation,
  parseAiCustomProposalSubmission,
} from "@/lib/bendalabs/ai-custom-proposal";
import { persistContactRequest } from "@/lib/leads/repository";
import { isLikelyContactRequestSpam } from "@/lib/leads/spam-detection";
import { isLeadStorageConfigured } from "@/lib/leads/supabase";

export const runtime = "nodejs";

function getValidationErrorMessage(issueMessage: string) {
  const map: Record<string, string> = {
    required_website: "Zadajte web, ktory chcete posudit.",
    invalid_website: "Zadajte platnu webovu adresu.",
    required_opportunity: "Doplnte, kde dnes vidite najvacsiu prilezitost na zlepsenie.",
    invalid_opportunity: "Text o prilezitosti je prilis dlhy.",
    invalid_dashboard_data: "Vyberte aspon jeden typ dat do dashboardu.",
    required_success_metric: "Doplnte, podla coho spoznate uspech po 30 dnoch.",
    invalid_success_metric: "Text o uspechu je prilis dlhy.",
    required_name: "Zadajte meno.",
    invalid_name: "Zadajte platne meno.",
    required_email: "Zadajte email.",
    invalid_email: "Zadajte platny email.",
    invalid_phone: "Telefon je prilis dlhy.",
    invalid_company: "Nazov firmy je prilis dlhy.",
  };

  return map[issueMessage] ?? "Skontrolujte vyplnene udaje.";
}

export async function POST(request: Request) {
  let payload: unknown = null;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatny request." }, { status: 400 });
  }

  const submission = parseAiCustomProposalSubmission(payload);

  if (!submission.success) {
    const message = submission.error.issues[0]
      ? getValidationErrorMessage(submission.error.issues[0].message)
      : "Skontrolujte vyplnene udaje.";

    return NextResponse.json(
      {
        error: message,
        issues: submission.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (!isLeadStorageConfigured()) {
    return NextResponse.json(
      { error: "Ukladanie leadov este nie je nakonfigurovane." },
      { status: 503 },
    );
  }

  const recommendation = generateAiCustomProposalRecommendation(submission.data);
  const message = buildAiCustomProposalLeadMessage(submission.data, recommendation);

  if (
    isLikelyContactRequestSpam({
      ...submission.data,
      locale: "sk",
      message,
      source: AI_CUSTOM_PROPOSAL_SOURCE,
      linkedAuditDomain: null,
    })
  ) {
    return NextResponse.json({ success: true, recommendation });
  }

  try {
    const savedRequest = await persistContactRequest(request, {
      name: submission.data.name,
      email: submission.data.email,
      website: submission.data.website,
      message,
      source: AI_CUSTOM_PROPOSAL_SOURCE,
      normalizedDomain: submission.data.normalizedDomain,
      linkedAuditDomain: null,
    });

    if (!savedRequest) {
      return NextResponse.json({ error: "Lead sa nepodarilo ulozit." }, { status: 500 });
    }

    return NextResponse.json({ success: true, recommendation });
  } catch (error) {
    console.error("AI custom proposal save failed.", error);
    return NextResponse.json({ error: "Lead sa nepodarilo ulozit." }, { status: 500 });
  }
}
