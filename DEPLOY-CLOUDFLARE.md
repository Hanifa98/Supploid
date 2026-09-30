# Deploy Supploid to Cloudflare

This guide deploys the Supploid source repository to Cloudflare Pages using GitHub. It also deploys the separate Durable Object Worker required by the quote and AOG forms. Follow the steps in order: the website can be online before forms are enabled, but forms cannot work until the Worker, Turnstile, Resend, and environment settings are all configured.

## Before you start

You need:

- A GitHub repository containing the contents of this folder, not the parent `outputs/` folder.
- A Cloudflare account with access to Workers and Pages.
- Control of the `supploid.com` DNS zone.
- A Resend account and a verified sending domain.
- Monitored inboxes or forwarding for `info@supploid.com` and `aog@supploid.com`.

Do not commit `.env`, `.dev.vars`, `node_modules`, `dist`, `reports`, `test-results`, or `playwright-report`. The included `.gitignore` excludes them. Commit `.env.example` and `.dev.vars.example`; they contain only empty placeholders.

## 1. Create the GitHub repository

1. Create a new private GitHub repository, for example `supploid`.
2. In this folder, initialize Git if needed, commit the source files, and push the `main` branch.
3. Confirm the repository root contains `package.json`, `wrangler.jsonc`, `functions/`, `workers/`, and `src/`.
4. Confirm GitHub does not show any real key, token, mailbox password, or local `.env` file.

The root `wrangler.jsonc` contains non-secret Pages settings and the `RFQ_LIMITER` binding. Keep it in the repository.

## 2. Finalize the two draft policy pages

Before collecting live form submissions, review and publish the final content of:

- `src/content/pages/privacy.md`
- `src/content/pages/terms.md`

The current pages are marked as drafts and intentionally contain items to confirm. At a minimum, finalize the legal controller wording, retention information, terms of sale, and provider disclosures. The site deliberately does not publish company registration numbers, address, or phone numbers.

## 3. Prepare email delivery with Resend

1. In Resend, add and verify the sending domain used for `rfq@supploid.com` and `noreply@supploid.com`.
2. Add the DNS records shown by Resend exactly as supplied: its DKIM record and its return-path SPF and MX records.
3. Do not replace the MX records used to receive mail for the domain. Resend verification does not create inboxes.
4. Publish one valid SPF policy at each hostname. If an SPF policy already exists, merge approved senders instead of adding a second SPF TXT record.
5. Add a suitable DMARC policy at `_dmarc.supploid.com` after confirming where any reports should go.
6. Create a Resend API key that is authorized to send from the verified domain. Save it in a password manager; do not put it in GitHub or this repository.
7. Confirm `info@supploid.com` and `aog@supploid.com` can receive messages. `info@supploid.com` receives internal web-form notifications. `aog@supploid.com` is the premium AOG reply address.

## 4. Create Cloudflare Turnstile keys

1. In Cloudflare, open **Turnstile** and create a new widget.
2. Add `supploid.com` and `www.supploid.com` as hostnames. Add a Pages preview hostname only if you plan to test live forms there.
3. Copy the site key and secret key.
4. Treat the site key as public. Treat the secret key as a server secret.

The application checks both Turnstile hostname and action. Do not reuse a key configured for unrelated domains.

## 5. Deploy the rate-limit Worker first

The Pages Functions call a separate Durable Object Worker named `supploid-rate-limiter`. Deploy it before configuring or enabling forms on Pages.

1. Install Node 22 and run `npm ci` in the repository root.
2. Authenticate the Cloudflare command-line tool:

   ```sh
   npx wrangler login
   ```

3. Deploy the Worker:

   ```sh
   npx wrangler deploy --config workers/rate-limiter/wrangler.jsonc
   ```

4. In Cloudflare **Workers & Pages**, confirm a Worker named `supploid-rate-limiter` exists. Its Durable Object class is `RfqLimiter`.

Do not rename this Worker unless you also update `script_name` in the root `wrangler.jsonc`.

## 6. Create the Cloudflare Pages project from GitHub

1. In Cloudflare, go to **Workers & Pages** and select **Create application**.
2. Choose **Pages**, then choose **Connect to Git**.
3. Authorize GitHub, select the `supploid` repository, and choose the `main` branch as the production branch.
4. Use these build settings:

   | Setting | Value |
   | --- | --- |
   | Framework preset | None, or Astro if Cloudflare fills the same values |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Node version | Node 22 |
   | Root directory | Leave empty when `package.json` is at repository root |

5. Start the first deployment with forms still disabled. This confirms the static site builds and publishes safely.

The build creates the generated images, social cards, sitemap, and robots file. `functions/` is deployed by Pages automatically because it is in the project root.

## 7. Configure the Durable Object binding in Pages

The checked-in `wrangler.jsonc` declares this binding:

| Field | Value |
| --- | --- |
| Variable name | `RFQ_LIMITER` |
| Durable Object class | `RfqLimiter` |
| Worker script | `supploid-rate-limiter` |

If Cloudflare imports the project `wrangler.jsonc` settings, confirm that binding appears in the Pages project settings. If it does not, add it manually:

1. Open the Pages project in **Workers & Pages**.
2. Go to **Settings** → **Bindings** → **Add** → **Durable Object**.
3. Set variable name to `RFQ_LIMITER`.
4. Select the Durable Object namespace from `supploid-rate-limiter` for the `RfqLimiter` class.
5. Save and redeploy the Pages project.

Do not create the Durable Object from the Pages project. It must remain defined and deployed in the separate Worker.

## 8. Add Pages environment variables and secrets

Open the Pages project, then **Settings** → **Environment variables**. Configure both Production and, if you intend to test live forms there, Preview separately.

### Public build variables

These are included at build time and can appear in browser HTML or JavaScript.

| Name | Production value |
| --- | --- |
| `PUBLIC_TURNSTILE_SITE_KEY` | The Turnstile site key from step 4 |
| `PUBLIC_FORMS_ENABLED` | `false` for initial static launch; change to `true` only in step 10 |
| `PUBLIC_INDEXABLE` | `false` for a review build; `true` when the public site is ready to be indexed |
| `PUBLIC_ANALYTICS_TOKEN` | Optional Cloudflare Web Analytics token; leave empty to disable analytics |

### Server variables

These are available only to Pages Functions.

| Name | Production value |
| --- | --- |
| `NOTIFY_EMAIL` | `info@supploid.com` |
| `ALLOWED_HOSTNAMES` | `supploid.com,www.supploid.com` |
| `FORMS_ENABLED` | `false` for initial static launch; change to `true` only in step 10 |

If you enable live forms on a preview hostname, include that exact hostname in both `ALLOWED_HOSTNAMES` and the Turnstile widget hostname list.

### Secrets

Create these as encrypted secrets, never as public build variables and never in `wrangler.jsonc`:

| Secret | Value |
| --- | --- |
| `RESEND_API_KEY` | The Resend API key from step 3 |
| `TURNSTILE_SECRET_KEY` | The Turnstile secret key from step 4 |
| `REFERENCE_SECRET` | A random secret of at least 32 characters |

For command-line setup, Cloudflare can prompt for each secret without writing it to a file:

```sh
npx wrangler pages secret put RESEND_API_KEY --project-name supploid
npx wrangler pages secret put TURNSTILE_SECRET_KEY --project-name supploid
npx wrangler pages secret put REFERENCE_SECRET --project-name supploid
```

Use the dashboard or the appropriate Pages environment option when you need different Preview and Production values.

## 9. Add the custom domain

1. In the Pages project, open **Custom domains** and add `supploid.com`.
2. Add `www.supploid.com` and choose the preferred redirect behavior.
3. If the DNS zone is already in Cloudflare, allow Cloudflare to create the required DNS records. If it is not, follow the specific DNS instructions Cloudflare shows for the domain.
4. Wait for the domain status to become active and HTTPS to be issued.
5. Visit both hostnames and confirm the preferred canonical hostname is used.

Do not manually guess CNAME target values. Cloudflare supplies the correct target for the selected Pages project.

## 10. Enable production forms and indexing

Only do this after policy, Turnstile, Resend, inbox, binding, and production-domain checks are complete.

1. Change both `PUBLIC_FORMS_ENABLED` and `FORMS_ENABLED` to `true` in the Production environment.
2. Change `PUBLIC_INDEXABLE` to `true` if the site is ready for search indexing.
3. Trigger a new deployment from the Pages dashboard or push a small reviewed commit to `main`.
4. Re-open the deployed site and verify that the Turnstile widget appears on the quote and AOG forms.

Changing only one of the two form flags keeps online delivery disabled. This is intentional.

## 11. Run production acceptance checks

Run these checks on `https://supploid.com`, not only on a Pages preview URL:

1. Submit an aviation inquiry with a test mailbox.
2. Submit an industrial inquiry without a part number, phone number, or company name.
3. Submit a premium AOG request.
4. Confirm each request receives a `SUP-YYYY-XXXXX` reference number.
5. Confirm the internal notification arrives at `info@supploid.com` and the requester receives a confirmation.
6. Confirm the AOG confirmation uses `aog@supploid.com` as its reply address.
7. Check Resend delivery events and spam folders. A provider acknowledgement is not proof of inbox delivery.
8. Submit more than five distinct test requests from the same IP only if you are intentionally checking rate limiting. It should return a clear limit response after five unique requests within an hour.
9. Check the homepage, quote page, and AOG page on a phone, including light/dark theme selection, keyboard navigation, and the email fallback.
10. Confirm `/sitemap.xml`, `/robots.txt`, canonical URLs, and social-preview images.

## 12. Ongoing deployment workflow

After the first production deployment:

1. Make a change on a Git branch.
2. Let Cloudflare create a preview deployment.
3. Review content, forms in email-draft mode, and styling at the preview URL.
4. Merge the reviewed branch into `main` to trigger a production deployment.
5. Re-run the production checks when changing form, email, Worker, domain, or policy configuration.

If you change the Durable Object class name or storage model, review Cloudflare Durable Object migration requirements before deploying the Worker. Do not delete or recreate the Worker casually: the rate limiter keeps short-lived protection state.

## Deployment support links

- [Cloudflare Pages configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [Cloudflare Pages bindings](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare Direct Upload and Git deployment differences](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/get-started/)
- [Cloudflare Pages Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/pages/)
- [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction)
- [Cloudflare Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
