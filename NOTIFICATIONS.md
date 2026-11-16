# Access-request notifications

Implemented, but delivery is inactive until sending providers are connected.

The destinations are stored privately in D1 under `site_settings.request_alert_destinations`, not in the public repository. They are visible only in the authenticated admin notification-status endpoint.

## Activate

Email uses Resend. Set Worker secrets `RESEND_API_KEY` and `ALERT_EMAIL_FROM` after verifying an appropriate sending address/domain. SMS uses Twilio. Set Worker secrets `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_FROM_NUMBER` for an SMS-capable sender. Use the Cloudflare dashboard or the documented secret input workflow, never commit credentials or paste them into chat. Get approval before purchasing a sender or paid service.

Do not alter the existing Microsoft 365 MX records. Sending-domain verification should preserve Outlook email.

Test delivery to the configured owner addresses before reporting alerts active. Provider acceptance alone does not prove inbox/handset delivery. No real messages were sent during implementation because providers are not connected.

## Behavior

A new verified signup inserts its membership and two outbox entries atomically. The unique (member_id,channel) key and the signup's unique email prevent repeat requests generating duplicate alerts. Existing seeded members do not generate alerts. Alert bodies contain a private-admin link and a generic notice, not client names, emails, form answers or health data.

The request schedules immediate sending with waitUntil. A five-minute Cron Trigger processes queued alerts if credentials are available; missing connections leave them queued without consuming send attempts. Pending alerts will be sent when the corresponding service is connected.

Claims are atomic, so concurrent processors do not send a row twice. Resend requests use a stable idempotency key. Explicit retryable responses are retried up to five attempts. Unknown SMS outcomes and interrupted sends are marked uncertain rather than automatically duplicated. Accepted means accepted by the provider, not delivered. Error codes are stored without provider response bodies or credentials.

Admin > Client access shows destinations, service configuration status and queued totals. Secrets are never returned to the browser. Signup itself continues working even when providers are missing or sending fails.
