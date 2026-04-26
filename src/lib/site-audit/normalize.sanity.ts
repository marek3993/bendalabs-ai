import { strict as assert } from "node:assert";
import { getFitLabelFromScore, getFitTierFromScore, normalizeAuditResult } from "./normalize";
import { getDomainAuditOverride } from "./overrides";
import type { RawSiteAudit } from "./schema";

function createAuditFixture(
  overrides: Partial<RawSiteAudit> & Pick<RawSiteAudit, "score" | "is_good_fit" | "summary">,
): RawSiteAudit {
  return {
    score: overrides.score,
    is_good_fit: overrides.is_good_fit,
    summary: overrides.summary,
    site_type: overrides.site_type ?? "Test web",
    recommended_ai_type: overrides.recommended_ai_type ?? ["navigator"],
    why_fit: overrides.why_fit ?? [
      "Pouzivatel potrebuje jasne usmernenie pri rozhodovani.",
      "Viacero decision pointov vytvara priestor na AI asistenciu.",
    ],
    friction_points: overrides.friction_points ?? [
      "Pouzivatel sa moze stratit pri vybere spravnej moznosti.",
      "Bez poradenstva je dalsi krok menej zrejmy.",
    ],
    upsell_opportunities: overrides.upsell_opportunities ?? [
      "AI moze odporucat relevantne doplnky pocas vyberu.",
    ],
    phase_one_plan: overrides.phase_one_plan ?? [
      "Nasadit asistovany vyber na klucovej vstupnej stranke.",
      "Prepojit AI odporucania s lead formularom.",
      "Zmerat dopad na odoslany dopyt a kvalitu leadov.",
    ],
    example_user_flows: overrides.example_user_flows ?? [
      {
        user_intent: "Chcem rychlo najst spravne riesenie pre svoju situaciu.",
        ai_action: "Asistent polozi par otazok a zredukuje pocet moznosti.",
        business_value: "Vyssia sanca, ze navstevnik prejde k relevantnemu dopytu.",
      },
      {
        user_intent: "Neviem, ktora varianta je pre mna vhodna.",
        ai_action: "AI porovna moznosti a odporuci dalsi krok.",
        business_value: "Menej odchodov z webu bez konverzie.",
      },
      {
        user_intent: "Chcem vediet, co sa oplati dokupit alebo doplnit.",
        ai_action: "AI odporuci doplnkove kroky podla potrieb uzivatela.",
        business_value: "Vyssi upsell potencial a lepsia relevancia ponuky.",
      },
    ],
  };
}

const facebookFixture = normalizeAuditResult(
  createAuditFixture({
    score: 10,
    is_good_fit: true,
    site_type: "Social network",
    summary:
      "Facebook je slabsi fit pre AI vrstvu v tomto type auditu a ma len limitovany prinos.",
    why_fit: [
      "Ide o siroky socialny feed bez jasneho decision flowu pre jeden obchodny ciel.",
      "Priestor pre AI vrstvu je obmedzeny a nevedie k jednoznacnemu conversion kroku.",
    ],
  }),
);

assert.equal(facebookFixture.is_good_fit, false);
assert.equal(facebookFixture.score, 3);
assert.equal(getFitLabelFromScore(facebookFixture.score), "Slaby fit");

const googleFixture = normalizeAuditResult(
  createAuditFixture({
    score: 9,
    is_good_fit: true,
    site_type: "Search engine",
    summary:
      "Google je slabsi fit pre tuto AI vrstvu, pretoze ide o velmi siroky utility web s minimalnym prinosom pre tento model.",
    why_fit: [
      "Pouzivatel ma otvoreny zamer a nie je tam jeden uzky funnel na asistovany vyber.",
      "AI vrstva by mala len obmedzeny dopad na konkretny conversion flow.",
    ],
  }),
);

assert.equal(googleFixture.is_good_fit, false);
assert.equal(googleFixture.score, 3);
assert.equal(getFitLabelFromScore(googleFixture.score), "Slaby fit");

const finportalFixture = normalizeAuditResult(
  createAuditFixture({
    score: 2,
    is_good_fit: false,
    site_type: "Financny portal",
    summary:
      "Finportal je velmi silny fit pre AI vrstvu, lebo ma vela decision pointov a vysoky potencial na odporucanie dalsieho kroku.",
    why_fit: [
      "Pouzivatel porovnava viacero produktov a potrebuje vedenie cez rozhodovanie.",
      "Web ma silny priestor na AI asistenciu pri vybere, lead qualification a dalsom kroku.",
    ],
  }),
);

assert.equal(finportalFixture.is_good_fit, true);
assert.equal(finportalFixture.score, 9);
assert.equal(getFitLabelFromScore(finportalFixture.score), "Velmi silny fit");

const rentuloFixture = normalizeAuditResult(
  createAuditFixture({
    score: 3,
    is_good_fit: false,
    site_type: "Rental marketplace",
    summary:
      "Rentulo je velmi silny fit pre AI vrstvu, pretoze spaja vyber ponuky, filtraciu a vysoko relevantne odporucanie dalsieho kroku.",
    why_fit: [
      "Pouzivatel sa rozhoduje medzi viacerymi moznostami a potrebuje rychly shortlist.",
      "Marketplace flow vytvara vyrazny priestor na AI navigaciu a odporucanie.",
    ],
  }),
);

assert.equal(rentuloFixture.is_good_fit, true);
assert.equal(rentuloFixture.score, 9);
assert.equal(getFitLabelFromScore(rentuloFixture.score), "Velmi silny fit");

const bendalabsOverride = getDomainAuditOverride("https://www.bendalabs.sk", "sk");

assert.ok(bendalabsOverride);
assert.equal(bendalabsOverride.score, 9);
assert.equal(bendalabsOverride.site_type, "service web / AI product landing page");
assert.equal(getFitTierFromScore(bendalabsOverride.score), "HIGH-FIT");

const bazosOverride = getDomainAuditOverride("https://www.bazos.sk/inzerat/123", "sk");

assert.ok(bazosOverride);
assert.equal(bazosOverride.score, 10);
assert.equal(bazosOverride.site_type, "classifieds marketplace");

const repeatedServiceAuditA = normalizeAuditResult(
  createAuditFixture({
    score: 3,
    is_good_fit: false,
    site_type: "Service web",
    summary:
      "Tento service web ma jasny lead flow, viac decision pointov a priestor na AI usmernenie navstevnika.",
  }),
  { inputUrl: "https://example-service.sk" },
);

const repeatedServiceAuditB = normalizeAuditResult(
  createAuditFixture({
    score: 9,
    is_good_fit: true,
    site_type: "AI product landing page",
    summary:
      "Tento AI product landing page ma jasny lead flow, viac decision pointov a priestor na AI usmernenie navstevnika.",
  }),
  { inputUrl: "https://example-service.sk" },
);

assert.equal(repeatedServiceAuditA.score, repeatedServiceAuditB.score);
assert.equal(repeatedServiceAuditA.is_good_fit, repeatedServiceAuditB.is_good_fit);
assert.equal(getFitTierFromScore(repeatedServiceAuditA.score), "HIGH-FIT");

console.log("Audit normalization sanity checks passed.");
