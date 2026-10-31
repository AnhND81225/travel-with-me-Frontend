# Order refunds — 2026-10-30

- My Orders reads refundPending from Order; pending refund blocks payment and ordinary cancellation. Admin approval uses server canApprove.
- /refunds submits a full balance request and shows pending/completed history. /admin/refunds requires a transfer reference (max 200) plus optional note (max 2000) when confirming a manual transfer.
- POST /api/payments/refunds/{id}/confirm body: {"transferReference":"BANK-123","note":"Transferred to customer"}. Backend stores actor ID and succeededAt; history displays reference, note and completion time.
- Backend cancels Order/items atomically when confirming a full refund. Existing successful refunds are not backfilled; restarting with Flyway must apply V2026103003 audit columns before using this code.
- No automatic ZaloPay refund, no partial refund or return workflow for approved/delivered orders, no change to tour lifecycle.
- Verification: npm run lint and npm run build PASS; browser/manual transfer not tested. Backend contract/verification: doc/PAYMENT_ORDER_INTEGRATION.md in BE repository.
