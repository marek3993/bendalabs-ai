import type { SiteAudit } from "../site-audit/schema";
import type { DashboardPreviewCopy, DashboardPreviewSegment } from "./dashboard-preview";

const segments: Record<DashboardPreviewSegment, { label: string; subject: string; question: string; next: string }> = {
  real_estate: { label: "Real estate", subject: "property", question: "Which properties match my location and budget?", next: "View matching properties or contact an agent" },
  finance_insurance: { label: "Finance and insurance", subject: "financial service", question: "Which service suits my situation?", next: "Choose a relevant service or request a consultation" },
  ecommerce: { label: "Online shop", subject: "product", question: "Which product meets my requirements?", next: "Compare suitable products" },
  marketplace_services: { label: "Marketplace and services", subject: "offer", question: "Which offer fits the task I need to complete?", next: "View relevant offers or send an enquiry" },
  healthcare_clinic: { label: "Healthcare clinic", subject: "service", question: "Which service should I enquire about before booking?", next: "View service information or contact reception" },
  dental_clinic: { label: "Dental clinic", subject: "dental service", question: "How do I arrange an initial dental appointment?", next: "View appointment information or contact reception" },
  aesthetic_dermatology_clinic: { label: "Aesthetic and dermatology clinic", subject: "consultation", question: "How do I book a consultation about my concerns?", next: "Review consultation options or contact reception" },
  eye_clinic: { label: "Eye clinic", subject: "eye-care service", question: "Which examination should I ask the clinic about?", next: "Review examination information or contact reception" },
  rental: { label: "Rentals", subject: "rental", question: "What equipment is suitable for my task and dates?", next: "Check suitable equipment and availability" },
  b2b_industrial: { label: "B2B and industrial services", subject: "business solution", question: "Which solution meets our requirements?", next: "Prepare a brief for the relevant specialist" },
  generic_business: { label: "Business website", subject: "service", question: "Which service matches what I need?", next: "Choose a service or prepare an enquiry" },
};
export function englishDashboard(audit: SiteAudit, domainLabel: string, segment: DashboardPreviewSegment): DashboardPreviewCopy {
  const context = segments[segment];
  const interactions = Math.max(32, Math.min(58, 26 + audit.score * 2 + audit.example_user_flows.length * 4 + audit.upsell_opportunities.length * 2));
  const qualified = Math.max(12, Math.min(24, Math.round(interactions * 0.43)));
  const highIntent = Math.max(4, Math.min(9, Math.round(qualified * 0.36 + audit.score / 5)));
  const questions = [context.question, "What information do I need before making contact?", "How do the available options differ?", "What should I do next?"];
  return {
    segment, domainLabel, segmentLabel: context.label, previewBadge: "AI dashboard preview", simulatedBadge: "Simulated data",
    previewNote: `Illustrative view for ${domainLabel}, based on the website type and audit. These are simulated examples, not measured visitor data.`,
    metrics: [
      { label: "Visitor needs captured", value: `${interactions} sample interactions`, hint: "Illustrative activity after an AI layer is introduced" },
      { label: "Qualified enquiries", value: `${qualified} sample enquiries`, hint: "Prepared for a relevant follow-up" },
      { label: "Most common topic", value: `Choosing a ${context.subject}`, hint: "A recurring theme in this simulation" },
      { label: "Ready for contact", value: `${highIntent} high-interest visitors`, hint: "Illustrative visitors closest to taking action" },
    ],
    leadTableTitle: "What your team could receive", leadTableCaption: "Sample enquiries showing intent, context and a useful next step.",
    leadColumnLabels: { intent: "Intent", detail: "Context", quality: "Quality", nextStep: "Next step" },
    leadRows: audit.example_user_flows.map((flow, index) => ({ intent: flow.user_intent, detail: flow.ai_action, quality: index === 0 ? "high" : "medium", qualityLabel: index === 0 ? "High" : "Medium", nextStep: context.next })),
    questionTitle: "Common questions and topics", questionItems: questions,
    intentTitle: "Common visitor goals", intentItems: [{ label: `Choose a ${context.subject}`, value: 44, hint: "Sample interest in available options" }, { label: "Prepare an enquiry", value: 33, hint: "Sample visitors clarifying their requirements" }, { label: "Take the next step", value: 23, hint: "Sample visitors ready for contact" }],
    insightsTitle: "What you could learn", insights: ["Which needs bring people to your website.", "Which choices cause uncertainty before contact.", "What information makes enquiries more useful to your team.", "Which journeys deserve attention next."],
    reasonsTitle: "Why visitors might not complete an enquiry", reasons: audit.friction_points.slice(0, 4),
    nextStepsTitle: "What to improve next", nextSteps: audit.phase_one_plan.slice(0, 4),
    highlightTitle: "What this could give you", highlightText: "An intelligent layer over your existing website could help visitors choose, prepare better enquiries and show your team where people need more guidance. Validate the impact with actual usage after launch.",
  };
}
