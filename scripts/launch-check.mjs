import { readFile } from 'node:fs/promises';
const issues=[];const privacy=await readFile('src/content/pages/privacy.md','utf8');const terms=await readFile('src/content/pages/terms.md','utf8');
if(/\[TO CONFIRM\]|draft for review|notice is a draft/i.test(privacy))issues.push('Privacy notice is still a draft: confirm controller disclosure, retention, processing basis, and provider arrangements.');
if(/draft for review|draft commercial framework/i.test(terms))issues.push('Terms of sale are still a draft: adopt the actual commercial terms.');
for(const key of ['PUBLIC_TURNSTILE_SITE_KEY','RESEND_API_KEY','TURNSTILE_SECRET_KEY','REFERENCE_SECRET','ALLOWED_HOSTNAMES'])if(!process.env[key])issues.push(`${key} is not present in this check environment. Set server secrets in Cloudflare; do not commit them.`);
if(process.env.PUBLIC_FORMS_ENABLED!=='true'||process.env.FORMS_ENABLED!=='true')issues.push('Live form delivery is not enabled in both build-time and server configuration.');
console.log(issues.length?'Launch requirements still open:\n- '+issues.join('\n- '):'Configuration checklist passed. Confirm deployed binding, DNS, mailbox delivery, and final policies before launch.');if(issues.length)process.exitCode=1;
