/**
 * E2E: full payment flows — credit card, Alipay, WeChat.
 * Covers create → status updates → completed → transaction query.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PaymentIntegrationService,
  PaymentMethod,
  PaymentStatus,
} from "../../src/payment-integration.js";

describe("Payment Integration E2E", () => {
  const payer = "e2e-customer-003";

  function runFlow(svc, method, amount) {
    const created = svc.createPayment({
      amount,
      currency: "USD",
      method,
      payerId: payer,
      meta: { scenario: "e2e-003" },
    });
    assert.equal(created.status, PaymentStatus.PENDING);

    const mid = svc.getPaymentStatus(created.id);
    assert.equal(mid.id, created.id);
    assert.equal(mid.status, PaymentStatus.PENDING);

    const completed = svc.processPayment(created.id);
    assert.equal(completed.status, PaymentStatus.COMPLETED);

    const final = svc.getPaymentStatus(created.id);
    assert.equal(final.status, PaymentStatus.COMPLETED);
    assert.ok(final.statusHistory.length >= 3);

    const ledger = svc.listTransactions({ payerId: payer, method });
    const hit = ledger.find((t) => t.id === created.id);
    assert.ok(hit, "transaction must appear in query results");
    assert.equal(hit.status, PaymentStatus.COMPLETED);
    assert.equal(hit.amount, amount);

    return created.id;
  }

  it("E2E credit card payment flow", () => {
    const svc = new PaymentIntegrationService();
    runFlow(svc, PaymentMethod.CREDIT_CARD, 150.0);
  });

  it("E2E Alipay payment flow", () => {
    const svc = new PaymentIntegrationService();
    runFlow(svc, PaymentMethod.ALIPAY, 88.88);
  });

  it("E2E WeChat payment flow", () => {
    const svc = new PaymentIntegrationService();
    runFlow(svc, PaymentMethod.WECHAT, 42.0);
  });

  it("E2E multi-method ledger for same payer", () => {
    const svc = new PaymentIntegrationService();
    runFlow(svc, PaymentMethod.CREDIT_CARD, 10);
    runFlow(svc, PaymentMethod.ALIPAY, 20);
    runFlow(svc, PaymentMethod.WECHAT, 30);

    const all = svc.listTransactions({ payerId: payer });
    assert.equal(all.length, 3);
    const methods = new Set(all.map((t) => t.method));
    assert.equal(methods.size, 3);
    assert.ok(methods.has(PaymentMethod.CREDIT_CARD));
    assert.ok(methods.has(PaymentMethod.ALIPAY));
    assert.ok(methods.has(PaymentMethod.WECHAT));
  });
});
