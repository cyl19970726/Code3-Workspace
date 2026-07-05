import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PaymentIntegrationService,
  PaymentMethod,
  PaymentStatus,
} from "../../src/payment-integration.js";

describe("PaymentIntegrationService (unit)", () => {
  it("rejects invalid method and amount", () => {
    const svc = new PaymentIntegrationService();
    assert.throws(() => svc.createPayment({ amount: 10, method: "bitcoin" }));
    assert.throws(() => svc.createPayment({ amount: 0, method: PaymentMethod.CREDIT_CARD }));
  });

  it("creates credit card payment in pending state", () => {
    const svc = new PaymentIntegrationService();
    const p = svc.createPayment({
      amount: 99.5,
      method: PaymentMethod.CREDIT_CARD,
      payerId: "user-1",
    });
    assert.equal(p.status, PaymentStatus.PENDING);
    assert.equal(p.method, PaymentMethod.CREDIT_CARD);
    assert.equal(p.amount, 99.5);
  });

  it("processes payment through status transitions", () => {
    const svc = new PaymentIntegrationService();
    const { id } = svc.createPayment({
      amount: 20,
      method: PaymentMethod.ALIPAY,
    });
    const done = svc.processPayment(id);
    assert.equal(done.status, PaymentStatus.COMPLETED);
    const hist = svc.getPaymentStatus(id).statusHistory.map((h) => h.status);
    assert.deepEqual(hist, [
      PaymentStatus.PENDING,
      PaymentStatus.PROCESSING,
      PaymentStatus.COMPLETED,
    ]);
  });

  it("lists transactions filtered by method and status", () => {
    const svc = new PaymentIntegrationService();
    const a = svc.createPayment({ amount: 1, method: PaymentMethod.WECHAT });
    svc.createPayment({ amount: 2, method: PaymentMethod.CREDIT_CARD });
    svc.processPayment(a.id);
    const wechatDone = svc.listTransactions({
      method: PaymentMethod.WECHAT,
      status: PaymentStatus.COMPLETED,
    });
    assert.equal(wechatDone.length, 1);
    assert.equal(wechatDone[0].method, PaymentMethod.WECHAT);
  });

  it("records failed payments", () => {
    const svc = new PaymentIntegrationService();
    const { id } = svc.createPayment({
      amount: 5,
      method: PaymentMethod.CREDIT_CARD,
    });
    svc.failPayment(id, "insufficient_funds");
    assert.equal(svc.getPaymentStatus(id).status, PaymentStatus.FAILED);
  });
});
