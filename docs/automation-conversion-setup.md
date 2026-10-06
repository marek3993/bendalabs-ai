# Automation lead measurement

The `/automatizacia` intake is a non-binding situation review. Only `situation`
(10–1200 characters) and `email` are required. Name is optional. The existing
contact request store remains the record of actual inquiries; legacy payloads
from already-open pages remain supported.

The API returns `eventId` only after the contact request has been persisted.
Honeypot/spam acknowledgements and storage failures never produce a conversion ID.

## OpenAI Pixel activation (not yet configured)

1. In the BendaLabs Ads Manager account, create a conversion source / pixel.
2. Set `NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID` to that actual pixel ID in the hosting
   environment and redeploy. This is a public identifier, not an API secret.
3. Configure a conversion event for the exact event `lead_created`, type
   `customer_action`, and attach it to the intended campaign. Keep the existing
   campaign objective and budget unless separately agreed.
4. Verify the real source receives a successful, consented form event and that
   failed/honeypot submissions do not produce one. Exclude technical test leads
   from customer counts. Pixel receipt alone does not prove ad attribution.

Until an ID is set, this integration loads no SDK, shows no consent checkbox,
and sends no OpenAI conversion events. Once configured, the optional consent
checkbox loads the SDK only after opt-in. Consent defaults to false before init,
can be revoked on the page, and is not persisted between visits. No advanced
matching, name, email, message, or purchase value is sent. The saved request ID
is used for event deduplication. A lead is not a paid order.

Reference: https://developers.openai.com/ads/measurement-pixel

## Validation

`npm run build`
`node scripts/check-automation.cjs --api-only`

API tests use an isolated fake storage service, not production. The full script
also contains desktop/mobile browser coverage for a developer's browser setup.
