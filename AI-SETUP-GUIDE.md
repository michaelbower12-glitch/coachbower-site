# Moving coachbower.com from Squarespace to Cloudflare

**Who this is for:** an AI assistant with a web browser (for example ChatGPT agent mode) working on behalf of Michael Bower. Michael is not technical. Do the clicking and typing yourself. Only hand control back to Michael when a page needs **his password, a verification code, or a payment/subscription decision**, and tell him in one plain sentence what to do and why.

**The goal:** coachbower.com and www.coachbower.com show the new website from this repository, hosted free on Cloudflare. His email (hello@coachbower.com, run by Microsoft 365/Outlook) must keep working the whole time.

**What is already known (checked 5 Nov 2026):**

| Thing | Value |
|---|---|
| Domain registrar (where the domain is owned) | **GoDaddy** |
| Current nameservers | connect1.squarespacedns.com, connect2.squarespacedns.com (Squarespace) |
| DNSSEC | off (nothing to do) |
| Email | Microsoft 365 / Outlook |
| Source of the new site | https://github.com/bowergit/coachbower-site (a template repository) |

## Golden rules

1. **Never delete or change the email records** listed in Step 4. If you are unsure about a record, leave it.
2. **Do not cancel anything on Squarespace until Step 8 says so.** The old site must stay up until the new one is confirmed working.
3. **Do not cancel the domain, transfer the domain, or touch Microsoft 365.**
4. Do not buy anything. Every step here is free. If a page asks for payment, stop and tell Michael.
5. At the end of each step, tell Michael in one short line what you just did.

---

## Step 1: Accounts (Michael does this, about 5 minutes)

Michael needs to be signed in to these in the browser you are using. If he is not, ask him to sign in or create the account:

- **GitHub** (free): https://github.com/signup
- **Cloudflare** (free): https://dash.cloudflare.com/sign-up
- **GoDaddy**: where coachbower.com is registered. If he doesn't know his GoDaddy login, ask him to use "Forgot password" with his usual email. If he says he never used GoDaddy, see "If the domain isn't at GoDaddy" at the bottom.
- **Squarespace**: only needed at Step 8.

## Step 2: Copy the website into Michael's GitHub

1. Open https://github.com/bowergit/coachbower-site
2. Click the green **Use this template** button, then **Create a new repository**.
3. Owner: Michael's account. Repository name: `coachbower-site`. Choose **Private**.
4. Click **Create repository**. Note the new address, e.g. `https://github.com/<michael>/coachbower-site`.

## Step 3: Put the website on Cloudflare

1. Open https://dash.cloudflare.com, then **Workers & Pages** in the left menu (under Compute), then **Create** (or **Create application**).
2. Choose **Import a repository** (Workers). When asked, connect GitHub: click **Connect GitHub** and allow the Cloudflare app access to **only** the `coachbower-site` repository. (GitHub may ask Michael to confirm with his password.)
3. Select `coachbower-site`. On the settings screen:
   - Project/Worker name: **coachbower** (it must match exactly).
   - Build command: leave **empty**.
   - Deploy command: leave the default, **`npx wrangler deploy`**.
   - Root directory: leave as `/`.
4. Click **Create and deploy** (or **Deploy**). Wait for the build to finish (1 to 3 minutes). It should end with a success message.
5. Open the `https://coachbower.<something>.workers.dev` address Cloudflare shows. Check that the home page, **Client stories** and **Blog** all load and look right. Tell Michael the link so he can look too.

If the build fails, open the build log, read the error, and try **Retry deployment** once. If it fails again, stop and show Michael the error text.

## Step 4: Add coachbower.com to Cloudflare

1. In Cloudflare, go to **Account home** (or **Websites / Domains**) and click **Add a domain** (or **Onboard a domain**).
2. Enter `coachbower.com`. Keep **Quick scan for DNS records** selected. Continue.
3. Choose the **Free** plan. Continue.
4. Cloudflare shows the DNS records it found. **Make sure these three email records exist exactly** (add any that are missing with **Add record**):

   | Type | Name | Content | Priority | Proxy |
   |---|---|---|---|---|
   | MX | `@` (coachbower.com) | `coachbower-com.mail.protection.outlook.com` | 0 | (not applicable) |
   | TXT | `@` | `MS=ms20781852` | | |
   | TXT | `@` | `v=spf1 include:spf.protection.outlook.com -all` | | |

   If Cloudflare also found records with names like `autodiscover`, `selector1._domainkey`, `selector2._domainkey`, `_dmarc`, `lyncdiscover`, `sip`, `enterpriseregistration`, `enterpriseenrollment`, `_sip`, `_sipfederationtls`: **keep them**. They belong to email too.

5. **Delete only the old Squarespace website records:**
   - The four **A** records for `coachbower.com` pointing to `198.185.159.144`, `198.185.159.145`, `198.49.23.144`, `198.49.23.145`
   - The **CNAME** record `www` pointing to `ext-sq.squarespace.com`
   - Any other record whose content contains `squarespace` (but never an MX or TXT record).
6. Continue. Cloudflare now shows **two nameservers** (they look like `name.ns.cloudflare.com`). Write both down exactly. You need them in Step 5.

## Step 5: Point the domain at Cloudflare (at GoDaddy)

1. Open https://dcc.godaddy.com/control/portfolio (GoDaddy **Domain Portfolio**). Michael may need to sign in and enter a code.
2. Click **coachbower.com**, then the **DNS** tab, then **Nameservers**, then **Change Nameservers**.
3. Choose **I'll use my own nameservers**. Replace the two Squarespace ones (`connect1.squarespacedns.com`, `connect2.squarespacedns.com`) with the **two Cloudflare nameservers** from Step 4. Remove any extra rows so there are exactly two.
4. Save. GoDaddy may warn that this can affect your website and email; confirm. (The email records were copied in Step 4, so email keeps working.)
5. Back in Cloudflare, on the coachbower.com overview page, click **Check nameservers now**.

Cloudflare usually becomes **Active** within 15 minutes to a couple of hours (rarely up to 24 hours). Cloudflare will also email Michael when it's active. Tell Michael: "The switch is done; it can take up to a few hours to kick in. Your old site and email keep working meanwhile."

## Step 6: Connect the domain to the new site (after Cloudflare says Active)

1. In Cloudflare: **Workers & Pages**, then **coachbower**, then **Settings**, then **Domains & Routes**, then **Add**, then **Custom domain**.
2. Enter `coachbower.com` and add it.
3. Repeat **Add**, then **Custom domain**, with `www.coachbower.com`.
4. If Cloudflare says a record already exists for that name, go to the coachbower.com **DNS records** page, delete the A/AAAA/CNAME record for that exact name (never MX/TXT), and try again.

## Step 7: Check everything works

1. Open https://coachbower.com and https://www.coachbower.com in a fresh tab. Both must show the **new** site (dark header, pink buttons, "Rehab & strength coaching without the fluff"). If one still shows the old site, wait 10 minutes and try again (or try a private window).
2. Click through: Client stories, Helpful resources, then Blog, then any article, then Get in touch (opens the Google Form).
3. Ask Michael to **send a test email to hello@coachbower.com from his phone or personal email**, and confirm it arrives in his Outlook. Also ask him to send one *from* hello@coachbower.com to his personal email. Both must work before Step 8.

## Step 8: Cancel the Squarespace website (only when Step 7 fully passed)

1. Ask Michael: "Everything is working on the new site. Shall I cancel the Squarespace website plan now?" Only continue on a clear yes.
2. Before cancelling, look in Squarespace for anything he still uses there (paid Email Campaigns, a shop, member areas, scheduling). Tell him if you find any, because those stop too.
3. In Squarespace: open the coachbower.com site, then **Settings**, then **Billing** (or **Billing & Account**), then the **Website** subscription, then **Cancel** (turn off auto-renew). Michael confirms the cancellation himself.
4. **Do not** remove or cancel the domain in Squarespace or GoDaddy, and do not touch Microsoft 365.

Done. Tell Michael: "Your website now runs on Cloudflare for free. Squarespace is cancelled. Your email is unchanged."

---

## Later: making changes to the website

All changes are made in Michael's GitHub repository `coachbower-site`. Every change saved there goes live on coachbower.com about 1 minute later, automatically.

### Add a new blog post

1. In GitHub, open the `posts` folder, click **Add file**, then **Create new file**.
2. Name it with the date and the web address of the post, all lowercase with dashes, e.g. `posts/2026-11-12-why-your-knees-hurt-on-stairs.html`. The part after the date becomes the post's address: `coachbower.com/blog/why-your-knees-hurt-on-stairs/`.
3. Content: copy this pattern, then put the article underneath as simple HTML (`<p>` paragraphs, `<h2>` subheadings, `<ul><li>` bullet lists, `<strong>` bold, `<a href="...">` links):

   ```html
   <!--
   title: Why your knees hurt on stairs
   date: 2026-11-12
   excerpt: One-sentence teaser that shows on the blog page.
   -->
   <p>First paragraph...</p>
   <h2>A subheading</h2>
   <p>More text...</p>
   ```

4. Click **Commit changes**. The post appears on the blog (newest first) about a minute later. Existing posts in the `posts` folder are good examples to copy.

### Change text or photos on the main pages

The pages are generated from `_build/build.cjs` (all the wording for Home and Client stories is in there) and `_build/style.css` (the look). **Don't edit the files in `public/` directly**: they're rebuilt on every change and edits there get overwritten. Find the wording in `_build/build.cjs`, edit it, and commit. New photos go in `public/img/`.

### Useful facts

- Contact: the **Get in touch** buttons open Michael's Google Form; replies come from the form, not the website.
- Newsletter: **Subscribe** goes to his Mailchimp page.
- Old Squarespace links that changed are redirected automatically (`public/_redirects` is generated by the build).
- Search engines are allowed, and `sitemap.xml` lists every page. Optionally, add coachbower.com to Google Search Console and submit `https://coachbower.com/sitemap.xml`.

## If the domain isn't at GoDaddy

Public records say GoDaddy, but if Michael can't get into any GoDaddy account:

- He may have bought it through **Microsoft 365** (which uses GoDaddy behind the scenes) or another company. Ask him to search his email for "coachbower.com" and "domain renewal" or "receipt" to find who bills him for it, then sign in there and find the **nameservers** setting.
- If it truly can't be found, stop and tell Michael. Don't guess.
