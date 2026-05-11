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
import type { ContactRequestSource } from "@/lib/leads/types";

export const runtime = "nodejs";

type SafeErrorCode = "validation_failed" | "missing_env" | "db_save_failed" | "constraint_failed";

function canExposeErrorCode() {
  return process.env.NODE_ENV !== "production";
}

function withSafeCode<T extends Record<string, unknown>>(payload: T, code: SafeErrorCode) {
  return canExposeErrorCode() ? { ...payload, code } : payload;
}

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function classifySaveError(error: unknown): SafeErrorCode {
  const details = getErrorDetails(error);
  const message = details.message.toLowerCase();

  if (
    message.includes("contact_requests_source_check") ||
    message.includes("check constraint") ||
    message.includes("violates check constraint") ||
    message.includes("23514")
  ) {
    return "constraint_failed";
  }

  return "db_save_failed";
}

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
  } catch (error) {
    console.error("AI custom proposal request JSON parsing failed.", getErrorDetails(error));
    return NextResponse.json(
      withSafeCode({ error: "Neplatny request." }, "validation_failed"),
      { status: 400 },
    );
  }

  const submission = parseAiCustomProposalSubmission(payload);

  if (!submission.success) {
    const message = submission.error.issues[0]
      ? getValidationErrorMessage(submission.error.issues[0].message)
      : "Skontrolujte vyplnene udaje.";

    return NextResponse.json(
      withSafeCode({
        error: message,
        issues: submission.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      }, "validation_failed"),
      { status: 400 },
    );
  }

  const submissionData = submission.data;
  const recommendation = generateAiCustomProposalRecommendation(submissionData);
  const message = buildAiCustomProposalLeadMessage(submissionData, recommendation);

  if (!isLeadStorageConfigured()) {
    console.error("AI custom proposal lead save skipped: missing Supabase environment variables.", {
      normalizedDomain: submissionData.normalizedDomain,
    });

    return NextResponse.json(
      withSafeCode(
        {
          success: true,
          leadSaved: false,
          recommendation,
          error: "Kontakt sa nepodarilo ulozit.",
        },
        "missing_env",
      ),
    );
  }

  if (
    isLikelyContactRequestSpam({
      ...submissionData,
      locale: "sk",
      message,
      source: AI_CUSTOM_PROPOSAL_SOURCE,
      linkedAuditDomain: null,
    })
  ) {
    return NextResponse.json({ success: true, leadSaved: false, recommendation });
  }

  if (canExposeErrorCode() && request.headers.get("x-bendalabs-simulate-save-fail") === "1") {
    console.error("AI custom proposal lead save intentionally simulated as failed.", {
      normalizedDomain: submissionData.normalizedDomain,
    });

    return NextResponse.json(
      withSafeCode(
        {
          success: true,
          leadSaved: false,
          recommendation,
          error: "Kontakt sa nepodarilo ulozit.",
        },
        "db_save_failed",
      ),
    );
  }

  async function saveContactRequest(source: ContactRequestSource) {
    return persistContactRequest(request, {
      name: submissionData.name,
      email: submissionData.email,
      website: submissionData.website,
      message,
      source,
      normalizedDomain: submissionData.normalizedDomain,
      linkedAuditDomain: null,
    });
  }

  try {
    const savedRequest = await saveContactRequest(AI_CUSTOM_PROPOSAL_SOURCE);

    if (!savedRequest) {
      console.error("AI custom proposal lead save returned no row.", {
        normalizedDomain: submissionData.normalizedDomain,
        source: AI_CUSTOM_PROPOSAL_SOURCE,
      });

      return NextResponse.json(
        withSafeCode(
          {
            success: true,
            leadSaved: false,
            recommendation,
            error: "Kontakt sa nepodarilo ulozit.",
          },
          "db_save_failed",
        ),
      );
    }

    return NextResponse.json({ success: true, leadSaved: true, recommendation });
  } catch (error) {
    const errorCode = classifySaveError(error);

    console.error("AI custom proposal lead save failed.", {
      code: errorCode,
      normalizedDomain: submissionData.normalizedDomain,
      source: AI_CUSTOM_PROPOSAL_SOURCE,
      error: getErrorDetails(error),
    });

    if (errorCode === "constraint_failed") {
      try {
        const fallbackSavedRequest = await saveContactRequest("contact_section");

        if (fallbackSavedRequest) {
          console.error("AI custom proposal lead saved with fallback source after constraint failure.", {
            normalizedDomain: submissionData.normalizedDomain,
            fallbackSource: "contact_section",
          });

          return NextResponse.json({ success: true, leadSaved: true, recommendation });
        }
      } catch (fallbackError) {
        console.error("AI custom proposal fallback lead save failed.", {
          normalizedDomain: submissionData.normalizedDomain,
          fallbackSource: "contact_section",
          error: getErrorDetails(fallbackError),
        });
      }
    }

    return NextResponse.json(
      withSafeCode(
        {
          success: true,
          leadSaved: false,
          recommendation,
          error: "Kontakt sa nepodarilo ulozit.",
        },
        errorCode,
      ),
    );
  }
}
