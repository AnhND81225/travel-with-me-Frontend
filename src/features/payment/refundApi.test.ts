import test from 'node:test';
import assert from 'node:assert/strict';
import { refunds } from './paymentApi';

test('refund rejection posts the reason with authentication and can list rejected requests', async () => {
  const oldFetch = globalThis.fetch;
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => 'admin-token' } });
  const calls: { path: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (path, init) => {
    calls.push({ path: String(path), init });
    return new Response(JSON.stringify({ data: { transactionId: 40, status: 'REJECTED', refundRejectionReason: 'Outside policy' } }), { status: 200 });
  }) as typeof fetch;
  try {
    const result = await refunds.reject(40, 'Outside policy');
    assert.equal(result.status, 'REJECTED');
    assert.equal(result.refundRejectionReason, 'Outside policy');
    assert.equal(calls[0].path, '/api/payments/refunds/40/reject');
    assert.equal(calls[0].init?.method, 'POST');
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { reason: 'Outside policy' });
    assert.equal(new Headers(calls[0].init?.headers).get('Authorization'), 'Bearer admin-token');
    await refunds.list(0, 'REJECTED');
    assert.equal(calls[1].path, '/api/payments/refunds?page=0&size=20&status=REJECTED');
    globalThis.fetch = (async () => new Response(JSON.stringify({ message: 'Refund is not pending' }), { status: 409 })) as typeof fetch;
    await assert.rejects(() => refunds.reject(40, 'Outside policy'), /Refund is not pending/);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldStorage) Object.defineProperty(globalThis, 'sessionStorage', oldStorage);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});
