# Coach Bower website admin

The admin entrance is `/admin/`. All `/admin/*` resources and API calls require a cryptographically verified Cloudflare Access JWT and one of these administrator emails: `hello@coachbower.com`, `michael.bower12@gmail.com`.

Authentication intentionally fails closed until `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` are configured. The public website remains available. Do not put admin links in the public navigation.

## Pending authorised authentication setup

Create a Cloudflare Access organization in account `938881b971a97de7eeac97c9e582e58c`, suggested domain `coachbower-admin.cloudflareaccess.com`. Enable the one-time email PIN provider. Create a self-hosted application protecting `coachbower.com/admin` and `www.coachbower.com/admin`, including all nested paths; allow only the two administrator emails above, 12-hour sessions. Do not protect the entire public website. Record the application's audience and actual team domain in wrangler.jsonc and redeploy. No shared password or secrets go into the repository. Verify anonymous and unapproved accounts are blocked and an approved email can log in.

## Editing

Choose a page and click a heading or paragraph in the preview. Edit text and use bold, italic, underline or line breaks. Preview locally within the iframe, then publish one block at a time. Publishing writes a durable content override in D1, not a Git commit. Changes apply on the next page load. Restore the original wording or load a prior version as a draft in Recent changes. Buttons, links, navigation, images and structural layouts are excluded from the editor.

The build generates content-addressed edit keys from each original source block plus its duplicate occurrence. Source edits that change a block's original content deliberately create a new key, so an old override will not silently attach to new content. Reordering unique blocks keeps their keys. Code edits to a block with an override should review and deliberately migrate its override if needed.

## Analytics

First-party client-side aggregate tracking stores only UTC date, canonical page path, source domain/category, broad device class, country code and count. No IP addresses, names, form contents, email addresses, query strings, persistent visitor IDs or cross-site tracking IDs are stored. Sessions are estimated per tab with sessionStorage and a 30-minute inactivity window, not unique visitors. Admin editor previews are excluded. The admin browser automatically sets a local exclusion flag and can resume counting using the dashboard. DNT and GPC are honoured; detectable bots are ignored. Ad blockers and browser settings can undercount; non-bot automated traffic can still inflate totals.

Enquiry clicks are Google Form opens, not submissions. Portal clicks are public portal entry interest, not successful logins. No historical backfill is available. Data is persisted in D1 and begins when installed.

## Maintenance

`npm ci`, `npm test`, `npm run build`, `npm run deploy:check`.

Cloudflare auto-deploys pushes to main via Wrangler. Keep the D1 binding in config. Apply `schema.sql` once to the configured database before deployment. D1 content outages fall back to source wording. Never fail open on authentication errors.
