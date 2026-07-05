/**
 * Payment integration — credit card, Alipay, WeChat.
 * In-memory store for testability; swap adapters for production gateways.
 */

export const PaymentMethod = {
  CREDIT_CARD: "credit_card",
  ALIPAY: "alipay",
  WECHAT: "wechat",
};

export const PaymentStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

function id() {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export class PaymentIntegrationService {
  constructor() {
    /** @type {Map<string, object>} */
    this._payments = new Map();
  }

  /**
   * @param {{ amount: number, currency?: string, method: string, payerId?: string, meta?: object }} input
   */
  createPayment({ amount, currency = "USD", method, payerId = "anonymous", meta = {} }) {
    if (!Object.values(PaymentMethod).includes(method)) {
      throw new Error(`Unsupported payment method: ${method}`);
    }
    if (typeof amount !== "number" || amount <= 0) {
      throw new Error("Amount must be a positive number");
    }

    const payment = {
      id: id(),
      amount,
      currency,
      method,
      payerId,
      meta,
      status: PaymentStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [{ status: PaymentStatus.PENDING, at: new Date().toISOString() }],
    };
    this._payments.set(payment.id, payment);
    return { ...payment };
  }

  /** Simulate gateway processing — advances PENDING → PROCESSING → COMPLETED. */
  processPayment(paymentId) {
    const payment = this._require(paymentId);
    if (payment.status === PaymentStatus.COMPLETED) {
      return { ...payment };
    }
    if (payment.status === PaymentStatus.FAILED) {
      throw new Error(`Payment ${paymentId} already failed`);
    }

    this._setStatus(payment, PaymentStatus.PROCESSING);
    this._setStatus(payment, PaymentStatus.COMPLETED);
    return { ...payment };
  }

  getPaymentStatus(paymentId) {
    const payment = this._require(paymentId);
    return {
      id: payment.id,
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
      currency: payment.currency,
      updatedAt: payment.updatedAt,
      statusHistory: [...payment.statusHistory],
    };
  }

  /**
   * @param {{ method?: string, payerId?: string, status?: string, limit?: number }} filters
   */
  listTransactions(filters = {}) {
    let rows = [...this._payments.values()];
    if (filters.method) rows = rows.filter((p) => p.method === filters.method);
    if (filters.payerId) rows = rows.filter((p) => p.payerId === filters.payerId);
    if (filters.status) rows = rows.filter((p) => p.status === filters.status);
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const limit = filters.limit ?? 100;
    return rows.slice(0, limit).map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      method: p.method,
      status: p.status,
      payerId: p.payerId,
      createdAt: p.createdAt,
    }));
  }

  /** Mark payment failed (e.g. declined card). */
  failPayment(paymentId, reason = "declined") {
    const payment = this._require(paymentId);
    payment.meta = { ...payment.meta, failReason: reason };
    this._setStatus(payment, PaymentStatus.FAILED);
    return { ...payment };
  }

  _require(paymentId) {
    const payment = this._payments.get(paymentId);
    if (!payment) throw new Error(`Payment not found: ${paymentId}`);
    return payment;
  }

  _setStatus(payment, status) {
    payment.status = status;
    payment.updatedAt = new Date().toISOString();
    payment.statusHistory.push({ status, at: payment.updatedAt });
  }
}
