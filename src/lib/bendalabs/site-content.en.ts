import type { AuditBotCopy, ServicePageContent } from "./site-content";

export const auditBotEnglish: AuditBotCopy = {
  badge: "AI website audit",
  title: "Where could an AI layer make your website easier to use?",
  subtext: "Enter your website address. No registration or email required.",
  description: "The audit reviews your homepage and relevant public pages to identify where an intelligent layer over your existing website could help visitors choose and prepare better enquiries. It is an initial assessment, not a measurement of actual conversions.",
  submitLabel: "Run a free audit", loadingLabel: "Analysing your website",
  loadingSteps: ["Loading your website…", "Reviewing how visitors choose a service…", "Assessing the potential for an AI layer…", "Preparing recommendations…"],
  placeholder: "e.g. yourcompany.com", invalidUrlMessage: "Enter a valid website address. A domain such as yourcompany.com is enough.",
  genericErrorMessage: "We could not generate the audit right now. Please try again.",
  activeAuditLabel: "Audit in progress", fitCardTitle: "Suitability for an AI layer", scoreLabel: "Score",
  solutionCardTitle: "Recommended solution", whyFitTitle: "Why this website is or is not a good fit",
  frictionTitle: "Where an AI layer could help visitors take the next step", upsellTitle: "Opportunities for relevant additional services",
  phaseOneTitle: "What the first phase could look like", exampleFlowsTitle: "Three examples of how an AI layer could help visitors",
  userIntentLabel: "Visitor's goal", aiActionLabel: "How AI could help", businessValueLabel: "Business value", nextStepLabel: "Next step",
  proposalTitle: "Would you like a full audit and a specific proposal?",
  proposalDescription: "Send your website and goals. I will suggest where an AI layer could be useful, which improvements to prioritise and a realistic first phase.",
  proposalButtonLabel: "Request a proposal", fitLabels: { low: "Low suitability", borderline: "Borderline suitability", good: "Good suitability", strong: "Very strong suitability" },
};

export const auditPageEnglish: ServicePageContent = {
  metadataTitle: "AI website audit | BendaLabs",
  metadataDescription: "Find out whether an AI layer could help visitors choose on your existing website, prepare better enquiries and take the right next step.",
  eyebrow: "AI website audit", title: "AI website audit",
  subtitle: "Discover whether an AI layer would suit your website, where visitors may lose their way and what a first implementation could look like.",
  heroChips: ["AI suitability assessment", "Potential points of friction", "A practical first phase"],
  auditBot: { badge: "AI website audit", proposalTitle: auditBotEnglish.proposalTitle, proposalDescription: auditBotEnglish.proposalDescription, proposalButtonLabel: "Discuss the next step" },
  sections: [
    { id: "hodnoti", label: "What the audit assesses", title: "Can visitors find the right path through your website?", description: "I review how visitors make decisions, where they may lose their way and whether an AI layer has a practical role. The focus is navigation, product choices, forms and how well the site responds to what people want to achieve.", surface: "soft", cards: [
      { title: "Decision points", text: "Where visitors have to choose a category, product, calculator or form before they have enough information to make the right choice." },
      { title: "Potential drop-off points", text: "Where people may leave before a form, between product details and an order, or on the way to making contact." },
      { title: "Visitor intent", text: "Whether visitors arrive with a specific task and whether the website can guide them to a useful next step." },
      { title: "Readiness for an AI layer", text: "Whether the content, structure and user journeys are clear enough for an AI layer to deliver measurable value in its first phase." },
    ] },
    { id: "dostanete", label: "What you receive", title: "A clear starting point for implementation.", description: "The audit helps you decide whether implementation makes sense, where to begin and what can wait. It looks beyond design and content to the path a visitor takes through the website.", surface: "white", bullets: ["An assessment of suitability and the scenarios most likely to benefit.", "Potential conversion obstacles and reasons visitors may drop off.", "A first-phase proposal: where to start, what the AI layer should do and which journeys to address first.", "Recommendations on what to measure after launch to evaluate the implementation."] },
    { id: "meranie", label: "Measurement after launch", title: "Measure visitor journeys and the quality of enquiries.", description: "Success should be defined before the AI layer launches. We need to know whether visitors reach the right journey, complete it more easily and give your team better information.", surface: "tint", bullets: ["How many visitors reach a relevant journey from their initial request.", "Changes in drop-off before a form, booking or order.", "Changes in completed enquiries or bookings after the first phase launches.", "How often visitors accept recommended next steps or related products.", "Remaining points of friction to address in the next iteration."] },
    { id: "cennik", label: "Pricing", title: "Clear pricing, with scope matched to your website.", description: "A single decision journey needs a simpler implementation. Multiple journeys, form types or more complex product choices require a broader setup.", surface: "white", statements: ["Simpler implementation — EUR 1,500 one-off", "More complex implementation — EUR 2,500 one-off", "Ongoing optimisation — EUR 190 per month", "AI usage — an estimated EUR 10–100 per month, based on actual use and billed through the client's OpenAI account"] },
  ],
  ctaTitle: "Send your website to find out where an AI layer could make sense.",
  ctaText: "A URL and a short description of where visitors or enquiries get lost are enough. I will respond with a specific assessment of suitability, a first phase and a realistic implementation scope.",
  ctaButtonLabel: "Request an AI website audit", ctaMailSubject: "AI website audit",
};

export const financePageEnglish: ServicePageContent = {
  metadataTitle: "AI layer for finance and insurance websites | BendaLabs",
  metadataDescription: "An intelligent layer over your existing finance or insurance website that helps visitors choose the right service, calculator or form and prepare better enquiries.",
  eyebrow: "Finance and insurance", title: "An AI layer for finance and insurance websites",
  subtitle: "Help more visitors find the right calculator, reduce drop-off before forms and improve completed enquiries.",
  heroChips: ["Mortgages and refinancing", "Motor liability and comprehensive insurance", "Investing, saving and contact"],
  auditBot: { badge: "AI website audit", proposalTitle: "Would you like an audit and an AI proposal for your finance or insurance website?", proposalDescription: "After the audit, we can examine where visitors choose the wrong journey, leave before a form or stop in a general section without making an enquiry.", proposalButtonLabel: "Discuss the next step" },
  sections: [
    { id: "problem", label: "The challenge", title: "The first choice can be the biggest obstacle.", description: "Visitors arrive with a need: lower repayments, car insurance, investment options or a person to contact. Requiring them to know the right product category can lose them before they reach a relevant journey.", surface: "soft", cards: [
      { title: "Mortgages and refinancing", text: "Visitors may not know whether they need a new mortgage, refinancing or an initial calculation. Choosing an unsuitable calculator can derail the journey at the start." },
      { title: "Motor liability and comprehensive insurance", text: "Decisions involve price, cover and whether someone needs a new policy or a change to an existing one. Menus and filters may not provide enough guidance." },
      { title: "Investing and saving", text: "Visitors can describe a goal more easily than a product. An unsuitable journey can leave them without a useful contact or enquiry." },
      { title: "Contact and forms", text: "Even someone ready to enquire can get lost among several forms. Losing that visitor before contact wastes an opportunity." },
    ] },
    { id: "co-robi", label: "How the AI layer helps", title: "Guide visitors into a suitable journey before they take a wrong turn.", description: "The intelligent layer sits over your existing website, understands a visitor's goal in their own words and points to a relevant calculator, form, product area or contact. It helps with selection and prepares better enquiries.", surface: "white", cards: [
      { title: "Start with the visitor's goal", text: "Visitors can say they want lower repayments, car insurance or an emergency fund. The system can guide them without waiting for them to find the product themselves." },
      { title: "Less drop-off before forms", text: "The layer can avoid dead ends and guide visitors towards a form relevant to their enquiry." },
      { title: "Relevant related products", text: "At an appropriate point, it could suggest a related next step, such as property insurance alongside refinancing or investment information alongside saving." },
      { title: "A better route to contact", text: "When further browsing is unhelpful, the layer can guide visitors directly to the contact or form your team can act on." },
    ] },
    { id: "konverzia", label: "Where conversion can break down", title: "The obstacle often appears before the final step.", description: "The gap between an initial need and the first relevant journey matters. If a visitor opens an unsuitable mortgage, insurance or investment page, the rest of the visit is spent recovering from that choice.", surface: "tint", bullets: [
      "Uncertainty about choosing a new mortgage, refinancing or an initial calculation.",
      "Difficulty weighing insurance cover, price and the next step.",
      "No clear investment or savings journey matching the visitor's goal and risk profile.",
      "Leaving before a form because the visitor is unsure they are in the right place.",
      "Missing a relevant related product when the visitor is ready to continue.",
    ] },
    { id: "meranie", label: "What to measure", title: "Define how the implementation will be evaluated.", description: "Measure whether the layer shortens the path to an enquiry, helps visitors reach relevant calculators and improves the information your team receives.", surface: "white", bullets: [
      "The share of visitors who reach a relevant calculator or form from their initial request.",
      "Changes in drop-off before forms and completed mortgage, insurance or investment enquiries.",
      "Visitors guided from a general entry point to a relevant business contact.",
      "Acceptance of related product suggestions and next steps.",
      "Remaining obstacles and the journeys to improve next.",
    ] },
  ],
  ctaTitle: "Let's identify where your finance or insurance website loses enquiries.", ctaText: "Send your URL, main product areas and the point where visitors tend to leave. I will assess whether an AI layer could make a practical difference.", ctaButtonLabel: "Send your website for assessment", ctaMailSubject: "AI layer for finance and insurance",
};

export const marketplacePageEnglish: ServicePageContent = {
  metadataTitle: "AI layer for marketplace and rental websites | BendaLabs",
  metadataDescription: "Help visitors find a suitable product, service or rental using an intelligent layer over your existing website, with clearer enquiries and fewer steps to booking.",
  eyebrow: "Marketplaces and rentals", title: "An AI layer for marketplace and rental websites",
  subtitle: "Visitors often arrive with a task, problem or situation rather than a product name. An AI layer can understand that need and guide them to a suitable listing, service or next step.",
  heroChips: ["Large catalogues and filters", "Guidance based on the task", "A shorter path to booking"],
  auditBot: { badge: "AI website audit", proposalTitle: "Would you like an audit and an AI proposal for your marketplace or rental website?", proposalDescription: "We can examine where visitors search for too long, choose an unsuitable offer or leave before booking.", proposalButtonLabel: "Discuss your website" },
  sections: [
    { id: "problem", label: "The challenge", title: "A strong catalogue still needs clear guidance.", description: "Many categories, filters and listing types can slow visitors down. People arrive with something they want to accomplish and may not know the right product name.", surface: "soft", cards: [
      { title: "Too many categories", text: "Visitors may have to learn how your catalogue is organised before they can find what they need." },
      { title: "Filters miss the underlying need", text: "Someone may need a product, a service or a complete set. They only know the task and when it needs to be done." },
      { title: "Menus lack context", text: "Traditional navigation cannot suggest the best next step for a specific problem, date, budget or use." },
      { title: "Booking is too far away", text: "Each unnecessary step between the initial need and a booking creates another opportunity to leave." },
    ] },
    { id: "intent", label: "How people search", title: "Start with the task the visitor wants to complete.", description: "The AI layer can connect a request to a relevant product, listing or next step without requiring visitors to know your catalogue structure or category names.", surface: "white", cards: [
      { title: "A task expressed naturally", text: "Visitors describe what they want to do. The layer identifies a relevant product, service or booking journey." },
      { title: "A more relevant first choice", text: "It can suggest suitable options without making visitors manually work through multiple categories, filters and specifications." },
      { title: "A clear next step", text: "If the visitor is not ready to book, it can point to useful details, a comparison, an enquiry form or a contact." },
      { title: "More purposeful visits", text: "Even in a broad catalogue, visitors can get to an actionable order or booking more easily." },
    ] },
    { id: "co-robi", label: "How the AI layer helps", title: "Understand the visitor's intent beyond keywords.", description: "The intelligent layer sits over your existing website. It helps visitors select a suitable offer and prepares a better enquiry when more information is needed.", surface: "tint", bullets: ["Recognise whether someone wants a product, a booking, an additional service or help choosing.", "Find a relevant product, service or rental journey without an exact category name.", "Make a large catalogue easier to navigate when menus and filters are insufficient.", "Guide the visitor towards an enquiry, booking or order.", "Suggest related options when they suit the task or rental dates."] },
    { id: "prinos", label: "Potential value", title: "Less searching and a clearer route to booking.", description: "The first phase should connect a visitor's need to a suitable offer more quickly. Its impact can then be measured through bookings, orders and the quality of enquiries.", surface: "white", bullets: ["A shorter journey from the first request to a booking or order.", "More visitors finding a relevant product on their first attempt.", "Less drop-off between listings, details and the checkout or booking form.", "Better insight into the tasks that bring people to your website.", "Clearer priorities for improving content, categories and business rules."] },
  ],
  ctaTitle: "Let's find where the path to booking takes too long.", ctaText: "Send your URL, main catalogue categories and where visitors tend to get lost or leave. I will assess whether an AI layer could shorten the path to an enquiry, booking or order in its first phase.", ctaButtonLabel: "Send your marketplace or rental website", ctaMailSubject: "AI layer for marketplaces and rentals",
};
