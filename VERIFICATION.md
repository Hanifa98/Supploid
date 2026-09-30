# Verification — MVP revision 1

Verified locally on 23 September 2026. This record replaces the initial-build measurements. The site is still a local preview; no deployment, DNS change, or real email send was performed.

## Revision acceptance

- The header has a keyboard-operable sun/moon button. The system preference is the default; an explicit choice persists in localStorage and is applied by a small head script before first paint. Storage-blocked browsers still work.
- Both palettes use CSS custom properties. Sixteen checked body, secondary-text, accent, alert, and button color pairs exceed 4.5:1; the lowest measured ratio is **6.15:1**.
- Browser assertions confirm identical element positions and dimensions when changing theme, and the saved preference is present at first paint after reload.
- The standard inquiry has exactly eight aviation fields or nine industrial fields, in the requested order. Industrial starts with Description and makes Part number optional. Shared values and the industrial description survive category changes.
- The same short form appears on the homepage and quote page. The AOG page retains its four required fields and premium route.
- Public country positioning and fixed turnaround-hour wording were removed from all 21 generated pages, metadata, and public scripts. Premium AOG availability remains 24/7.
- Homepage capabilities, documentation, and field-note sections are removed. The capabilities header link is removed. Process steps are 01 / Submit your inquiry, 02 / Confirm the documents, 03 / Arrange the shipment.
- All six service detail pages and the insights index/four articles remain live. Their footer links remain available.
- Server validation and both email templates match the shorter inquiry. Turnstile, honeypot, shared rate limiting, references, provider idempotency, and confirmation handling remain in place. Removed upload controls are also rejected by the endpoint.

## Checks

| Check | Result |
| --- | --- |
| Static build | Passed, 21 HTML pages |
| Astro/server TypeScript | Passed, zero errors, warnings, or hints |
| Backend and limiter tests | **35 passed** |
| Desktop/mobile browser tests | **32 passed**, zero skipped or flaky |
| Accessibility | No axe violations across eight page types, both themes, desktop and mobile |
| Build audit | Passed; internal targets, titles, images, public secret checks, old country/time wording |
| Cloudflare Pages Functions compilation | Passed using Wrangler |
| Visual inspection | Light desktop homepage and mobile industrial inquiry reviewed; both themes captured |

Provider calls are mocked in API and browser tests. No test establishes actual mailbox delivery. Automated accessibility checks complement visual and keyboard checks; they are not an exhaustive accessibility certification.

## Mobile Lighthouse

The homepage, quote page, and AOG page were each measured in light and dark themes using Lighthouse 12, installed Chrome, mobile emulation, and simulated throttling. Cache clearing remained enabled; localStorage held only the theme preference.

All six runs scored **100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO**.

| Page | Light LCP | Dark LCP | CLS, both themes | TBT, both themes |
| --- | --- | --- | --- | --- |
| Homepage | 1.503 s | 1.502 s | 0 | 0 ms |
| Quote | 1.352 s | 1.352 s | 0 | 0 ms |
| Premium AOG | 1.502 s | 1.502 s | 0 | 0 ms |

All unique first-party JavaScript, including executable inline scripts, totals **4,438 bytes gzipped**, about 4.3 KiB. This is below the 120 KiB budget and down from 5,636 bytes in the initial build. The homepage transfers about 88 KiB in the Lighthouse measurement. It now includes the actual inquiry form rather than the previous small handoff form.

The audit used the indexable build configuration. The final supplied `dist/` has been rebuilt in default **noindex preview mode**. Draft policies remain noindex regardless. Live Turnstile and optional analytics were disabled during measurement; their impact must be checked when configured. Lab scores are not a guarantee of field performance. Field INP remains a post-launch measurement.

## Evidence

- `reports/revision-browser-tests.json`
- `reports/revision-contrast.json`
- `reports/build-audit.json`
- `reports/revision-lighthouse-summary.json` and `reports/revision-lighthouse/`
- `reports/revision-screenshots/`
- `reports/revision-browser-errors.json`

## Remaining launch work

Configure Cloudflare, the existing limiter Worker binding, Turnstile, Resend, and monitored receiving mailboxes. Verify actual standard/AOG email receipt and confirmations on the deployed host. Finalise the policy drafts and enable live submission and indexing when ready.

Public registration numbers, address, and phone numbers remain omitted by owner preference. The preview prepares email drafts and downloadable request details; direct online sending is disabled until configured.
