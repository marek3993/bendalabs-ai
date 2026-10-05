import type { AiCustomProposalSubmission, AiCustomProposalRecommendation, AiCustomProposalBusinessType, AiCustomProposalMainGoal, AiCustomProposalVisitorNextStep, AiCustomProposalDashboardData } from "./ai-custom-proposal";

export const proposalOptionLabels = {
  real_estate: "Real estate website or agency", finance: "Financial services, insurance or mortgages", clinic: "Clinic, healthcare or aesthetic services", marketplace: "Classifieds or marketplace", recruitment: "Recruitment, HR or jobs portal", b2b_services: "B2B services or consulting", ecommerce: "Online shop or product catalogue", other: "Other",
  choose_right_offer: "Help visitors choose the right service or offer", better_leads: "Get better-prepared enquiries", simplify_contact: "Make booking or contact easier", discover_intent: "Understand what visitors are looking for", reduce_unclear_questions: "Reduce unclear questions for the team or reception", increase_existing_traffic_value: "Get more value from existing traffic",
  send_inquiry: "Send an enquiry", book_appointment: "Book an appointment", choose_service: "Choose a service", find_offer: "Find a suitable offer, listing or product", contact_right_person: "Contact the right person", fill_form: "Complete a form",
  top_questions: "Visitors' most common questions", interest_types: "Services, products or offers people are interested in", contact_reasons: "Reasons people contact the business", unfinished_inquiries: "Unsent or unfinished enquiries", lead_quality: "Quality of leads and enquiries", timing_or_urgency: "Preferred dates or urgency", customer_segments: "Customer segments",
};

const businesses: Record<AiCustomProposalBusinessType, { target: string; output: string; entry: string }> = {
  real_estate: { target: "a suitable property, listing or agent", output: "more precise property enquiries and clearer context before contact", entry: "on the homepage, listings or enquiry form" },
  finance: { target: "the appropriate financial service or consultation", output: "better-prepared enquiries and fewer general questions", entry: "on product pages, calculators or before the enquiry form" },
  clinic: { target: "the appropriate service, treatment or appointment", output: "fewer unclear questions for reception and better-prepared bookings", entry: "on service pages or before appointment booking" },
  marketplace: { target: "a suitable offer, listing or category", output: "more relevant enquiries and clearer data on customer interests", entry: "over the catalogue, search or listing details" },
  recruitment: { target: "a suitable role, service or contact", output: "better-qualified enquiries from companies and candidates", entry: "on careers pages, contact points or forms" },
  b2b_services: { target: "the right service, consultation or next step", output: "enquiries with useful context and a clearer brief", entry: "on key service pages or before contact" },
  ecommerce: { target: "a suitable product, category or form", output: "more value from existing traffic and fewer repeated questions", entry: "on category pages, product details or the contact journey" },
  other: { target: "the right next step without unnecessary searching", output: "better-prepared enquiries and useful customer insights", entry: "where visitors decide what to do next" },
};
const goals: Record<AiCustomProposalMainGoal, { title: string; visitor: string; team: string; phase: string }> = {
  choose_right_offer: { title: "An AI layer for choosing the right service or offer", visitor: "It could help visitors understand their options and avoid an unsuitable path.", team: "Your team could receive enquiries from people who already know which area interests them.", phase: "Set up questions that quickly identify what is most relevant to the visitor." },
  better_leads: { title: "An AI layer for better-prepared enquiries", visitor: "It could gather useful context and help visitors clarify their needs before submitting an enquiry.", team: "Your team could receive clearer enquiries instead of general messages.", phase: "Carry the answers directly into the enquiry so the context is preserved." },
  simplify_contact: { title: "An AI layer for easier booking and contact", visitor: "It could shorten the journey from initial interest to booking or contact.", team: "Fewer visitors may leave before a form or appointment booking.", phase: "Add the layer before the key contact or booking step." },
  discover_intent: { title: "An AI layer for understanding visitor intent", visitor: "Visitors could reach the right offer while you learn what they are actually looking for.", team: "You could gain insight into interests, topics and points of hesitation.", phase: "Capture visitor intent in a dashboard over the existing website." },
  reduce_unclear_questions: { title: "An AI layer for clearer customer questions", visitor: "It could explain the differences between options before guiding visitors to a contact or form.", team: "Your team could handle fewer repeated questions and more informed enquiries.", phase: "Start with common questions and guidance to a suitable next step." },
  increase_existing_traffic_value: { title: "An AI layer for more value from existing traffic", visitor: "More visitors could find a relevant next step during their existing visit.", team: "You could get more from the website without rebuilding it.", phase: "Choose one page with meaningful traffic and a difficult decision point for the first phase." },
  other: { title: "An AI layer tailored to your goal", visitor: "It could guide visitors towards a next step based on what they want to achieve.", team: "Your team could gain better context and new insights into visitor interests.", phase: "Start with one clear goal and a measurable user journey." },
};
const nextSteps: Record<AiCustomProposalVisitorNextStep, string> = {
  send_inquiry: "It could clarify the need before sending an enquiry with useful context.", book_appointment: "It could help visitors choose a suitable service and move smoothly into booking.", choose_service: "It could help compare options before suggesting the next step.", find_offer: "It could make the catalogue easier to navigate and suggest offers that match the need.", contact_right_person: "It could identify the need and direct visitors to the appropriate person.", fill_form: "It could prepare visitors to complete the form with less uncertainty.", other: "It could turn an unclear start into a concrete next step.",
};
const dashboard: Record<AiCustomProposalDashboardData, string> = {
  top_questions: "Common visitor questions and topics that repeatedly cause hesitation.", interest_types: "The services, products and offers attracting the most interest.", contact_reasons: "Why people contact the business and what they want to achieve.", unfinished_inquiries: "Where people start an enquiry but do not complete it.", lead_quality: "The difference between general enquiries and well-prepared leads.", timing_or_urgency: "Preferred dates, urgency and signs that a visitor is ready to act.", customer_segments: "Customer groups based on their needs and preferred next steps.", other: "Other business insights relevant to your team's priorities.",
};
export function englishProposal(submission: AiCustomProposalSubmission): AiCustomProposalRecommendation {
  const business = businesses[submission.businessType], goal = goals[submission.mainGoal];
  const text = submission.opportunityText.toLowerCase();
  const signal = /enquir|inquir|form|lead/.test(text) ? "The strongest opportunity is improving the information available before an enquiry is sent." : /book|appoint|reserv/.test(text) ? "The strongest opportunity is making booking easier with fewer intermediate steps." : /question|reception|team|call/.test(text) ? "The strongest opportunity is answering repeated questions and guiding people to a useful next step." : /service|offer|product|listing/.test(text) ? "The strongest opportunity is helping people find a suitable service, offer or product sooner." : "The strongest opportunity is making decisions easier on the existing website.";
  return {
    summary: `Based on your answers, ${goal.title.replace(/^An /, "an ")} could be a useful starting point. This intelligent layer would sit over your existing website, help visitors find ${business.target} and prepare better enquiries with useful context for your team.`,
    recommendedLayerTitle: goal.title,
    visitorValue: [goal.visitor, nextSteps[submission.visitorNextStep], `The existing journey could stay in place while the AI layer helps visitors find ${business.target} more easily.`],
    teamValue: [goal.team, `Your team could gain ${business.output}.`, signal],
    dashboardValue: submission.dashboardData.map(item => dashboard[item]),
    phaseOne: [`Add a short guided entry point ${business.entry}, without rebuilding the website.`, goal.phase, "Save the outcome in the intent dashboard and enquiry so the team can see what the visitor needed before a call."],
    nextStep: `I recommend a 15-minute call to review ${submission.normalizedDomain} and choose one page or journey for an initial trial. After 30 days, assess success against your stated goal: ${submission.successMetric}`,
  };
}
