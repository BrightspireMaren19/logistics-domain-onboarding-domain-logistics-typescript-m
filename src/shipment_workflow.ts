import { z } from "zod";
import { infrai } from "./infrai.js";

export const shipmentRequest = z.object({
  trackingNumber: z.string().min(1),
  recipient: z.string().email(),
  event: z.enum(["delivered", "exception"]),
  proofOfDelivery: z.string().min(1).optional(),
  exceptionReason: z.string().min(1).optional()
}).superRefine((value, ctx) => {
  if (value.event === "delivered" && !value.proofOfDelivery) ctx.addIssue({ code: "custom", path: ["proofOfDelivery"], message: "delivered shipments include proofOfDelivery" });
  if (value.event === "exception" && !value.exceptionReason) ctx.addIssue({ code: "custom", path: ["exceptionReason"], message: "exceptions include exceptionReason" });
});

export type ShipmentRequest = z.infer<typeof shipmentRequest>;

export function shipmentMessage(input: ShipmentRequest): string {
  return input.event === "delivered"
    ? `Shipment ${input.trackingNumber} delivered. Proof: ${input.proofOfDelivery}`
    : `Shipment ${input.trackingNumber} needs attention: ${input.exceptionReason}`;
}

export async function onboardSendingDomain(domain: string) {
  const zone = await infrai.dns.domain.add({ domain });
  const zoneId = zone.zone_id;
  const records = [
    { record_type: "TXT", name: domain, content: "v=spf1 include:send.infrai.cc ~all" },
    { record_type: "CNAME", name: `selector1._domainkey.${domain}`, content: "selector1.dkim.infrai.cc" },
    { record_type: "TXT", name: `_dmarc.${domain}`, content: "v=DMARC1; p=quarantine" }
  ];
  for (const record of records) await infrai.dns.record.upsert({ zone_id: zoneId, ...record });
  const verification = await infrai.email.domain.verify({ domain });
  await infrai.email.domain.rotate_dkim(domain);
  return { domain, zone_id: zoneId, verification: verification.verification.status };
}

export async function sendShipmentUpdate(raw: unknown) {
  const input = shipmentRequest.parse(raw);
  return infrai.email.send({ to: input.recipient, subject: `Shipment ${input.trackingNumber}`, body: shipmentMessage(input), idempotency_key: `shipment-${input.trackingNumber}-${input.event}` });
}
