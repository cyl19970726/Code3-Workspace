# Payment Integration — E2E Test Runbook

Spec: `tests/fixtures/specs/003/spec.md`  
Issue: [Code3-Workspace #13](https://github.com/cyl19970726/Code3-Workspace/issues/13)

## Prerequisites

- Node.js 18+ (`node --version`)

## Run all tests

```bash
npm test
```

Or:

```bash
bash run_tests.sh
```

## Run separately

```bash
npm run test:unit   # unit tests — PaymentIntegrationService
npm run test:e2e    # E2E flows — credit card, Alipay, WeChat
```

## What is covered

| Acceptance criteria | Test location |
|---------------------|---------------|
| Credit card payments | `tests/e2e/payment-integration.e2e.test.js` |
| Alipay / WeChat | same E2E file |
| Real-time status updates | `processPayment` + `statusHistory` assertions |
| Transaction query | `listTransactions` filters |
| Unit + integration | `tests/unit/` + `tests/e2e/` |

## Architecture

- `src/payment-integration.js` — in-memory payment service (swap gateway adapters in production)
- Status flow: `pending` → `processing` → `completed` (or `failed`)

## Expected output

All tests pass (9 total: 5 unit + 4 E2E).
