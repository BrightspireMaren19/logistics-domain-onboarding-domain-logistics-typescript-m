import { onboardSendingDomain, sendShipmentUpdate } from "../src/shipment_workflow.js";

const domain = process.env.SENDING_DOMAIN;
const recipient = process.env.DEMO_EMAIL_TO;
if (!domain || !recipient) throw new Error("SENDING_DOMAIN and DEMO_EMAIL_TO are required");

const setup = await onboardSendingDomain(domain);
console.log("sending domain ready:", setup);
const delivery = await sendShipmentUpdate({ trackingNumber: "LGT-2048", recipient, event: "delivered", proofOfDelivery: "signed-at-door" });
console.log("shipment update sent:", delivery);
