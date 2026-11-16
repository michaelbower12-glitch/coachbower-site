# Client portal and email sign-in

Client entrance: `/client-login/`. Public coaching preview: `/client-portal/`. Protected onboarding content: `/portal/`.

The protected portal now lives on coachbower.com and uses Cloudflare Access email one-time codes, independent of ChatGPT. The original ChatGPT-hosted Site remains private as a legacy copy; the main website no longer sends clients there.

Cloudflare application ID: `8712fcae-bcac-4171-82ec-6bd3572d9a50`. Its policy ID is `ecd5a0af-83e9-493d-8de1-3cbf8a1f26c4`. Approved emails were carried over from the original portal access list at migration. Membership is now managed under Client access in the website admin area. The authentication policy permits verified-email signup; D1 membership approval controls private content. Never make the portal public to add a member.

The Worker verifies the client application's JWT audience and issuer before serving any `/portal` asset. Client tokens do not authorize `/admin/`. Anonymous and forged requests fail closed; private content is served with no-store headers. The admin Access application is separate and unchanged.

The login page is a branded entrance; Continue with email opens Cloudflare's email verification form. Clients need access to their invited email inbox, not a ChatGPT account or a shared password.

All original onboarding, form, checkbox notes, support, library, referral and sharing content is retained. Support, library and referral sections are collapsed initially to keep onboarding the focus.

Checklist progress uses browser-local storage, as before. Because this is a new origin compared with the legacy ChatGPT Site, old device-local checklist state does not automatically migrate. No form answers, medical details or per-client programs are copied or stored in this portal.

## Reusable invitation and approval

Send `https://coachbower.com/join/`. A new client verifies email through the existing email-code provider, then enters their name. The Worker takes the email from the verified token, never a submitted email field. Duplicate requests are deduplicated by case-insensitive email.

Membership is now authoritative in D1 `portal_members`. In `/admin/` choose **Client access** to copy the invite link, view pending requests, approve or decline, search approved clients and revoke/restore access. Owner memberships cannot be changed through this screen. Status changes are concurrency-checked and audited in `portal_member_history`.

After deploying the membership check and seeding existing approved clients, change the client Access policy to allow email-code-authenticated users to reach the signup handler. This permits verified users to request membership; it does not grant portal content. Every protected request checks D1 for `approved` status. New/pending/declined/revoked users see the signup/status page instead. The separate admin audience and administrator allowlist remain mandatory for membership management.

The waiting page checks approval every 20 seconds while visible, or via Check access. Approval emails are not sent. Return to the invitation link or normal login after approval. A revocation applies on the next portal request; it does not erase content already rendered in an open browser tab.
