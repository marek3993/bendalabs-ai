import type { AuditRecord, DomainLeadSnapshot } from "@/lib/leads/types";

type HotLeadAlertInput = {
  domain: string;
  snapshot: DomainLeadSnapshot;
  audit: AuditRecord;
};

function getAlertConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUDIT_ALERT_EMAIL_FROM;
  const to = process.env.AUDIT_ALERT_EMAIL_TO || "hello@bendalabs.sk";

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from, to };
}

export async function sendHotLeadAlert(input: HotLeadAlertInput) {
  const config = getAlertConfig();

  if (!config) {
    console.warn("Hot lead alert preskoceny: chyba RESEND_API_KEY alebo AUDIT_ALERT_EMAIL_FROM.");
    return;
  }

  const subject = `Hot lead: ${input.domain} dosiahol 3 audity`;
  const recommendedTypes = input.audit.recommended_ai_type.join(", ");
  const text = [
    `${input.domain} dosiahol hot lead threshold.`,
    `Audit count: ${input.snapshot.auditCount}`,
    `Last seen: ${input.audit.created_at}`,
    `Last fit score: ${input.audit.fit_score}/10`,
    `Returning interest: ${input.snapshot.isReturningInterest ? "ano" : "nie"}`,
    `Recommended AI type: ${recommendedTypes || "nezistene"}`,
    `Summary: ${input.audit.summary}`,
    `Input URL: ${input.audit.input_url}`,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Nepodarilo sa odoslat hot lead alert: ${details}`);
  }
}
