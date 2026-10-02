# Production SEO and ChatGPT discovery

Audited main at `05538f26dbb4e6c0bbbdee42e1821b13454e4207`, including the preceding website publication and homepage changes. There were no open PRs at audit time.

## Origin evidence and configuration

The canonical origin is `https://bendalabs.sk`:

- `src/lib/site-audit/error.ts` already identifies it as the BendaLabs URL.
- The live HTTPS domain serves the matching homepage metadata and Vercel headers.
- The latest commit has a successful Vercel deployment status.
- `www.bendalabs.sk` serves the same site; all generated canonicals consolidate on the non-www origin.
- Vercel project inspection was denied for the connected account's team scope. No claim is made about project environment variables or firewall configuration.

`src/lib/bendalabs/seo.ts` centralizes this confirmed default. Optionally set `SITE_URL=https://bendalabs.sk` in the deployment environment **before building**. No new value is required for this domain. For a future domain move, change this single environment variable and rebuild. Invalid values fail the build instead of publishing malformed metadata. Request hosts and ephemeral Vercel deployment URLs never determine canonicals.

## Implemented behavior

- 13 public routes have self-canonical URLs, existing route-specific titles/descriptions, full Open Graph metadata and Twitter large-image cards.
- Six Slovak/Czech route pairs have reciprocal `sk`, `cs`, and `x-default` alternates in HTML and the sitemap. The Slovak proposal flow has no invented Czech equivalent.
- `/share-image` is a statically generated 1200×630 PNG using Next.js ImageResponse, with no external font or image fetches.
- `/sitemap.xml` contains only real public pages, with no fabricated modification dates or fragment URLs.
- Production `/robots.txt` allows public pages and assets, disallows API/admin crawling, and advertises the sitemap.
- Admin and the four success/failure pages have `noindex, nofollow`; API/admin responses additionally carry `X-Robots-Tag`. Form-result pages remain crawlable so crawlers can observe their noindex metadata. Robots rules are not authentication.
- Development and Vercel preview builds carry noindex metadata, disallow crawling, and expose an empty sitemap. Non-Vercel staging deployments must also supply `VERCEL_ENV=preview` when building to opt into this behavior. Never promote a preview-built artifact to production without rebuilding.
- The homepages emit JSON-LD for the website, its creator Marek Benda, and the BendaLabs/BendaRobotics brands, using facts visible on the site.
- Existing page components, design, redirects, Google Ads scripts, conversion tracking and form handlers are preserved. Metadata and structured data render on the server without requiring JavaScript execution.

## ChatGPT search

`OAI-SearchBot` is explicitly allowed on public routes with the same API/admin exclusions. This is the crawler OpenAI documents for ChatGPT search discovery. Model training (`GPTBot`) is a separate setting; this change adds no special training rule. `ChatGPT-User` is a user-triggered fetcher and is not the search indexing control.

Source: https://developers.openai.com/api/docs/bots

No `llms.txt`, ranking promises, fabricated reviews, or invented social profiles are required or added. Crawl eligibility and structured data cannot guarantee inclusion or recommendations. After deployment, verify that Vercel's firewall does not challenge OpenAI's published searchbot IP ranges (https://openai.com/searchbot.json). A request using the bot's user-agent from another IP cannot prove that check. The connected account could not inspect that firewall.

## Validation

```sh
npm ci
npm run lint
npm run build
npm run check:seo
# Against the local production server, without live API credentials:
npm run start -- --hostname 127.0.0.1 --port 3100
npm run check:seo -- http://127.0.0.1:3100
```

The check covers origin validation, preview rules, complete filesystem route classification, raw HTML metadata on every public page, query-parameter-free canonicals, reciprocal language links, private-page noindex, JSON-LD, Google Ads tag presence, API/admin headers, existing redirects, unknown-route 404, sitemap XML, robots output and PNG dimensions. Do not run this full check against a production environment with a configured admin login: its private-page expectations assume a local environment without credentials.

## Release

Merge the reviewed branch into main using the existing deployment workflow. After deployment verify `/robots.txt`, `/sitemap.xml`, `/share-image`, and a Slovak/Czech page on the canonical origin. Submit the sitemap to Google Search Console and Bing Webmaster Tools if those properties are available. Social platforms may need their preview cache refreshed. No production deployment or search-engine submission is performed by this PR.
