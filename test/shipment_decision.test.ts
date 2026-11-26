import test from "node:test";
import assert from "node:assert/strict";
import { shipmentMessage, shipmentRequest } from "../src/shipment_workflow.js";

test("a delivered shipment with proof produces a delivery message", () => {
  const parsed = shipmentRequest.safeParse({ trackingNumber: "LGT-2048", recipient: "ops@example.com", event: "delivered", proofOfDelivery: "signed-at-door" });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(shipmentMessage(parsed.data), "Shipment LGT-2048 delivered. Proof: signed-at-door");
});

test("an exception without a reason is rejected at the request boundary", () => {
  const parsed = shipmentRequest.safeParse({ trackingNumber: "LGT-2048", recipient: "ops@example.com", event: "exception" });
  assert.equal(parsed.success, false);
});
