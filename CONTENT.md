# Editing Supploid content

Editorial pages live in `src/content/pages/`, capabilities in `src/content/services/`, and articles in `src/content/insights/`. These files are the content source; there is no CMS or admin interface.

## Add an insight

Create a file such as `src/content/insights/my-procurement-guide.md`:

```md
---
title: A precise, useful article title
description: A unique summary for the article card and search description.
publishDate: 2026-09-23
author: Supploid
tags: [Procurement, Aviation]
heroImage: /images/insight-documents
draft: true
---

Opening paragraph.

## A useful section heading

Write the content here. Include direct links to authoritative sources for
technical statements and distinguish a procurement checklist from a
technical or installation decision.
```

The filename becomes the URL: `/insights/my-procurement-guide/`. The page title is the only H1, so begin body headings at H2. Set `draft: false` when the content is reviewed and ready. Drafts are excluded from page generation and the index. The insights index includes all published articles. The homepage has no article teaser section.

The four initial articles were created for this build and should receive the owner’s editorial review before public launch. Their publication dates reflect the build date, not an invented history of earlier company publishing.

## Images

`heroImage` is a public path without a file extension. Both `.avif` and `.webp` must exist, with dimensions 800 × 480 for the article-card layout. Four abstract illustrations are available: `insight-documents`, `insight-conditions`, `insight-aog`, and `insight-materials`.

Add new technical artwork to `scripts/assets.mjs`, or add properly sized real photography to `public/images/`. Do not imply the site’s illustrative artwork depicts inventory. Avoid accreditation graphics, synthetic staff, artificial warehouses, and invented aircraft photographs.

The build generates each page’s Open Graph and Twitter preview image separately in `dist/og/`.

## Edit a capability

Capability files use `title`, `shortTitle`, `description`, `eyebrow`, `category` (`aviation` or `industrial`), `order`, and `parts` frontmatter. The title/summary render in the card and detail page. The markdown body renders on the detail page. A new service automatically receives its detail URL and appears in the appropriate track on the capabilities index. Service cards do not appear on the homepage.

## Global text and design

- `src/lib/site.ts`: public emails, site URL, navigation, documentation labels.
- `src/pages/index.astro`: homepage section copy and structure.
- `src/content/pages/home.md`: homepage introduction and metadata.
- `src/styles/global.css`: colour, typography, spacing, responsive and motion rules.
- `src/components/FormEnd.astro`: consent notice, action state, and fallback links.
- `server/email.ts`: transactional email wording.
- `src/lib/rfq.ts`: shared request fields and human-readable request export.

Keep “Fast quoting, documentation supplied” consistent across public pages and transactional emails. Do not restore a fixed turnaround-hour promise. Premium AOG remains separate and available 24/7, with scope and terms agreed for the request.

The short inquiry form is shared by the homepage and quote page through `src/components/QuoteForm.astro`. Keep the browser payload, server validation, and both email templates aligned when changing fields. Theme palettes live on `[data-theme="dark"]` and `[data-theme="light"]`; the head script sets the theme before first paint.

## Editorial rules

- No unsupported accreditation, certification, inventory, customer, network-size, history, or performance claims.
- Source documents originate with the manufacturer, repair organisation, or other actual source. Supploid passes them through and confirms availability before quoting.
- Registration identifiers, addresses, maps, and public phones are intentionally absent by owner preference.
- Inspection, return, retention, legal, and commercial commitments require real policy decisions. Do not remove a draft marker merely to make the page look finished.
- Keep descriptions unique and links intact. Run `npm run build` and `npm run audit` after content changes.
