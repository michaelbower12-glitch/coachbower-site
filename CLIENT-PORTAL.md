# Client portal and email sign-in

Client entrance: `/client-login/`. Public coaching preview: `/client-portal/`. Protected onboarding content: `/portal/`.

The protected portal now lives on coachbower.com and uses Cloudflare Access email one-time codes, independent of ChatGPT. The original ChatGPT-hosted Site remains private as a legacy copy; the main website no longer sends clients there.

Cloudflare application ID: `8712fcae-bcac-4171-82ec-6bd3572d9a50`. Its policy ID is `ecd5a0af-83e9-493d-8de1-3cbf8a1f26c4`. Approved emails were carried over from the original portal access list at migration. Future membership changes must update this Cloudflare Access policy, not the legacy ChatGPT Site list. Never make the protected portal public to add a member.

The Worker verifies the client application's JWT audience and issuer before serving any `/portal` asset. Client tokens do not authorize `/admin/`. Anonymous and forged requests fail closed; private content is served with no-store headers. The admin Access application is separate and unchanged.

The login page is a branded entrance; Continue with email opens Cloudflare's email verification form. Clients need access to their invited email inbox, not a ChatGPT account or a shared password.

All original onboarding, form, checkbox notes, support, library, referral and sharing content is retained. Support, library and referral sections are collapsed initially to keep onboarding the focus.

Checklist progress uses browser-local storage, as before. Because this is a new origin compared with the legacy ChatGPT Site, old device-local checklist state does not automatically migrate. No form answers, medical details or per-client programs are copied or stored in this portal.
