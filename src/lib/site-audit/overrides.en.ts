import type { SiteAudit } from "./schema";
import { siteAuditSchema } from "./schema";

const realtyProfiles: Record<string, { label: string; context: string; focus: string }> = {
  "bosen.sk": { label: "Real estate brokerage and listings", context: "property listings and brokerage services", focus: "a suitable property, agent or enquiry form" },
  "herrys.sk": { label: "Residential property and development projects", context: "residential listings and development projects", focus: "a suitable property or development project" },
  "haloreality.sk": { label: "High-volume property listings portal", context: "a large range of property listings", focus: "relevant listings and the right agent" },
  "directreal.sk": { label: "Full-service real estate network", context: "property offers, services and regional contacts", focus: "the right service, agent or local office" },
  "lexxus.sk": { label: "Premium property and development projects", context: "premium property offers and development projects", focus: "a suitable property, project or consultation" },
  "winnersreality.sk": { label: "Nationwide real estate network", context: "property listings and contacts across regions", focus: "the right regional office, agent or listing" },
  "rivers.sk": { label: "Premium residential and investment property", context: "residential and investment property choices", focus: "an offer suited to residential or investment needs" },
  "arec.sk": { label: "Bratislava property listings", context: "property offers in Bratislava", focus: "a suitable local listing or property enquiry" },
  "remax-slovakia.sk": { label: "Franchise real estate network", context: "a network of offices, agents and property offers", focus: "the appropriate office, agent or enquiry form" },
};
export function englishAuditOverride(domain: string, original: SiteAudit): SiteAudit {
  const realty = realtyProfiles[domain];
  if (realty) return siteAuditSchema.parse({
    ...original,
    site_type: realty.label,
    summary: `This website has strong potential for an AI layer over its existing pages. With ${realty.context}, the main opportunity is to understand a visitor's needs and guide them towards ${realty.focus}.`,
    why_fit: [
      `The website combines ${realty.context}, creating several decision points.`,
      "Visitors often arrive with a location, budget or need rather than the name of a listing or contact.",
      `An AI layer could connect their intent to ${realty.focus}.`,
      "Better context before contact could improve the relevance of enquiries without replacing the existing website.",
    ],
    friction_points: [
      "Visitors may need help choosing between property search, selling a property and contacting an agent.",
      "Location, budget and property requirements can be difficult to express through navigation alone.",
      "A broad range of offers can make the first useful next step unclear.",
      "A generic enquiry may omit information the team needs for a useful response.",
    ],
    upsell_opportunities: [
      "Suggest a relevant consultation when the visitor needs help narrowing their options.",
      "Recognise related buying or selling needs when the visitor's situation supports them.",
      "Connect a clarified need to the appropriate service or contact within the existing website.",
    ],
    phase_one_plan: [
      "Start on the main entry page, selected listings and key contact points.",
      "Ask short questions about the visitor's goal, location and requirements before suggesting a next step.",
      "Measure the path to relevant listings, completed enquiries and the quality of information sent to the team.",
    ],
    example_user_flows: [
      { user_intent: "I want to buy a home in a particular area and price range.", ai_action: "Clarify the location, budget and priorities, then suggest relevant listings and a next contact.", business_value: "A faster path to relevant offers and a better-prepared enquiry." },
      { user_intent: "I want to sell a property and need the right person to contact.", ai_action: "Identify the property type and location, then guide the visitor to a suitable agent or office.", business_value: "More relevant enquiries with less unnecessary redirection." },
      { user_intent: "I am unsure which option or service fits my situation.", ai_action: "Ask a few focused questions and suggest a suitable listing, consultation or enquiry form.", business_value: "Less uncertainty before contact and clearer information for the team." },
    ],
  });
  if (domain === "bazos.sk") return siteAuditSchema.parse({
    ...original, site_type: "Classifieds marketplace",
    summary: "Bazos is a strong candidate for an intelligent layer over its existing website. Visitors often describe a need rather than an exact category or product, so the layer could simplify search, listing categorisation and the next useful action.",
    why_fit: ["A broad catalogue creates many choices between categories and offers.", "Visitors may know what they need without knowing the right search terms.", "An AI layer could guide both buyers and people creating a listing.", "The existing marketplace journey provides clear next steps for relevant recommendations."],
    friction_points: ["Visitors may search several categories before finding relevant listings.", "A request in everyday language may not match the catalogue's category names.", "People creating a listing may be unsure where to place it.", "Filters alone may not capture a visitor's task, budget and location together."],
    upsell_opportunities: ["Suggest relevant related listings when they fit the visitor's task.", "Help sellers prepare clearer listing details.", "Guide visitors from a clarified need to a useful search or seller contact."],
    phase_one_plan: ["Add a guided entry point above search and category selection.", "Clarify the task, location and budget before suggesting relevant results.", "Measure useful searches, listing completion and relevant seller contacts."],
    example_user_flows: [
      { user_intent: "I need affordable equipment for a specific task near me.", ai_action: "Clarify the task, budget and location, then suggest the appropriate category and search.", business_value: "A shorter path to relevant listings." },
      { user_intent: "I want to sell something but do not know which category to use.", ai_action: "Identify the item and suggest a suitable category and useful listing details.", business_value: "Clearer listings and fewer misplaced offers." },
      { user_intent: "I cannot find the right offer using the current filters.", ai_action: "Ask what matters most and guide the visitor to a more relevant search.", business_value: "Fewer abandoned searches and more useful contacts." },
    ],
  });
  return siteAuditSchema.parse({
    ...original, site_type: "AI services and digital products",
    summary: "An AI layer could help BendaLabs visitors understand which service is relevant, choose between an audit and a consultation, and prepare a clearer enquiry. The existing audit and contact journeys provide practical starting points.",
    why_fit: ["The website presents AI services with an audit and contact journey.", "Visitors need to understand whether an AI layer suits their own website.", "The enquiry process can benefit from context gathered before contact.", "Guidance to the next step is directly connected to a useful business conversation."],
    friction_points: ["Visitors may need help judging whether the AI layer suits their website.", "The choice between an audit, a specific service and direct contact can need clarification.", "Visitors may leave before choosing a relevant next step.", "The enquiry should preserve context from the visitor's initial interest."],
    upsell_opportunities: ["Recommend a relevant service based on the website type and business goal.", "Suggest an audit or consultation when it fits the visitor's readiness.", "Gather useful context to prepare a more focused proposal."],
    phase_one_plan: ["Guide visitors between the audit, service pages and contact form.", "Ask short questions about their website, goals and decision points.", "Measure completed audits, enquiries and the quality of information received."],
    example_user_flows: [
      { user_intent: "I have a service website and want to know whether an AI layer would help.", ai_action: "Clarify the website type and goal, then recommend an audit or relevant service page.", business_value: "More relevant visitors reaching an assessment or enquiry." },
      { user_intent: "I am unsure whether to request an audit or a consultation.", ai_action: "Ask a few focused questions and suggest the appropriate next step.", business_value: "Less uncertainty and better-prepared contact." },
      { user_intent: "I want to understand what an AI layer could do on my website.", ai_action: "Explain a relevant use case and connect it to an audit or a specific proposal.", business_value: "A clearer path from interest to a useful business discussion." },
    ],
  });
}
