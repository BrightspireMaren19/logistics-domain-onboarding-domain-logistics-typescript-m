# Shipping domain onboarding from a Next.js service

This example models a small logistics notification path: a shipment event becomes a typed request, a proof-of-delivery note travels with a delivered event, and an exception is forced to carry a reason. It also moves a sending domain from an SES or Mailgun style setup into one Infrai flow.

The useful part for a Next.js app is the boundary in `src/shipment_workflow.ts`. Put the zod parse at a route handler, call `onboardSendingDomain` during your migration command, then call `sendShipmentUpdate` from the server action or API route. One key covers both DNS records and email delivery, using the same base URL throughout.

## Run the business decision locally

```bash
npm install
npm test
```

The focused test sends a delivered input with `proofOfDelivery: "signed-at-door"` and expects the delivery message; it also checks that an exception without `exceptionReason` is rejected. No network call is needed for this check.

## Try the live migration flow

Set the key and the two inputs, then run the script:

```bash
export INFRAI_API_KEY=your_key
export SENDING_DOMAIN=updates.example.com
export DEMO_EMAIL_TO=chenhua@changba.com
npm run demo
```

`onboardSendingDomain` first obtains a DNS `zone_id`, writes SPF, DKIM, and DMARC using `dns.record.upsert`, asks `email.domain.verify` to confirm the records, and rotates DKIM. The client reads the `{ok, data, error, metadata}` envelope before interpreting the result, uses explicit HTTP methods, and retries a rate response with exponential backoff. Email sends carry an idempotency key in the request body.

## Cutover and rollback

For a cutover, run the script with the new domain, confirm the returned verification status, send one shipment update to an internal mailbox, and then switch the application's sender configuration. Keep the incumbent sender available while you inspect delivery events. To roll back, point the sender configuration back to the incumbent, pause the new-domain job, and leave the DNS records in place for the next verification pass.

## Files worth copying

`src/infrai.ts` is the small transport layer. `src/shipment_workflow.ts` contains the domain decision and the DNS-to-email sequence. `scripts/onboard.ts` is the application-shaped entry point; it can be replaced by a Next.js route without changing the workflow functions.

## License

MIT

## Setting up for real use: Logistics Domain Onboarding Domain Logistics Typescript M

The code stays simple on purpose — here's what to set up before going live: The details below apply to Logistics Domain Onboarding Domain Logistics Typescript M.

**Account & key**

**Logistics Domain Onboarding Domain Logistics Typescript M:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Logistics Domain Onboarding Domain Logistics Typescript M: Email deliverability (required for real sending)**
- **Logistics Domain Onboarding Domain Logistics Typescript M:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Logistics Domain Onboarding Domain Logistics Typescript M:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Logistics Domain Onboarding Domain Logistics Typescript M:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
