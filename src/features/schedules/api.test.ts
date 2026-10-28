import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { participantApi, scheduleApi } from './api';
import { managedBranches } from './hooks';
const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
const tokens = new Map<string, string>();
let calls: { path: string; init: RequestInit }[] = [];
beforeEach(() => {
  tokens.clear(); tokens.set('treektour.catalog.token', 'test-token'); calls = [];
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: (k: string) => tokens.get(k) || null, removeItem: (k: string) => tokens.delete(k) } });
  globalThis.fetch = async (path, init = {}) => { calls.push({ path: String(path), init }); return Response.json({ status: 200, data: [] }); };
});
after(() => { globalThis.fetch = originalFetch; if (originalStorage) Object.defineProperty(globalThis, 'sessionStorage', originalStorage); else Reflect.deleteProperty(globalThis, 'sessionStorage'); });
test('registration sends only note and shared Bearer, never client price/user/count', async () => {
  await scheduleApi.register(11, 'Ăn chay');
  assert.equal(calls[0].path, '/api/schedules/11/participants');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { note: 'Ăn chay' });
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer test-token');
});
test('manual confirmation includes current attempt UUID and payment reference', async () => {
  await participantApi.confirm(4, 'attempt-uuid', 'CASH-004');
  assert.equal(calls[0].path, '/api/participants/4/manual-payment-confirmations');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { registrationReference: 'attempt-uuid', paymentReference: 'CASH-004' });
});
test('list preserves backend array response and page filters', async () => {
  const result = await scheduleApi.list({ page: 2, branchId: 3, eventId: 9, status: 'OPEN' });
  assert.deepEqual(result, []);
  const url = new URL(calls[0].path, 'http://localhost');
  assert.equal(url.searchParams.get('page'), '2'); assert.equal(url.searchParams.get('size'), '20');
  assert.equal(url.searchParams.get('branchId'), '3'); assert.equal(url.searchParams.get('eventId'), '9');
});
test('attendance sends only the allowed status through the canonical endpoint', async () => {
  await participantApi.checkIn(2); await participantApi.noShow(3);
  assert.equal(calls[0].path, '/api/participants/2/attendance');
  assert.equal(calls[0].init.method, 'PATCH');
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { status: 'CHECKED_IN' });
  assert.equal(calls[1].path, '/api/participants/3/attendance');
  assert.equal(calls[1].init.method, 'PATCH');
  assert.deepEqual(JSON.parse(String(calls[1].init.body)), { status: 'NO_SHOW' });
});
test('cancellation forwards manager reason, update can explicitly unassign guide', async () => {
  await participantApi.cancel(2, 'Khách yêu cầu'); await scheduleApi.update(8, { guideId: null, maxParticipants: 20 });
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { reason: 'Khách yêu cầu' });
  assert.equal(calls[1].path, '/api/schedules/8');
  assert.equal(calls[1].init.method, 'PATCH');
  assert.deepEqual(JSON.parse(String(calls[1].init.body)), { guideId: null, maxParticipants: 20 });
});
test('API conflicts remain errors and do not retry or fabricate a success', async () => {
  globalThis.fetch = async () => { calls.push({ path: '', init: {} }); return Response.json({ message: 'Hết chỗ' }, { status: 409 }); };
  await assert.rejects(() => scheduleApi.register(1, ''), (e: any) => e.status === 409 && e.message === 'Hết chỗ');
  assert.equal(calls.length, 1);
});
test('401 clears expired shared token', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Cần đăng nhập' }, { status: 401 });
  await assert.rejects(() => participantApi.get(1)); assert.equal(tokens.size, 0);
});
test('staff context only includes active assignments for current user in active branch', async () => {
  globalThis.fetch = async path => Response.json({ data: String(path) === '/api/branches' ? [{ id: 1, status: 'ACTIVE' }, { id: 2, status: 'ACTIVE' }, { id: 3, status: 'INACTIVE' }] : String(path).endsWith('/1') ? [{ userId: 7, status: 'ACTIVE' }] : [{ userId: 8, status: 'ACTIVE' }, { userId: 7, status: 'INACTIVE' }] });
  const branches = await managedBranches({ id: 7, role: 'STAFF', status: 'ACTIVE', fullName: 'Test' });
  assert.deepEqual(branches.map(b => b.id), [1]);
});
test('staff context fails closed when assignment API fails', async () => {
  globalThis.fetch = async path => String(path) === '/api/branches' ? Response.json({ data: [{ id: 1, status: 'ACTIVE' }] }) : Response.json({ message: 'Không có quyền' }, { status: 403 });
  await assert.rejects(() => managedBranches({ id: 7, role: 'STAFF', status: 'ACTIVE', fullName: 'Test' }));
});

test('guide assignments use principal-scoped endpoints with pagination and status', async () => {
  await scheduleApi.assigned({ page: 1, status: 'CLOSED' });
  const url = new URL(calls[0].path, 'http://localhost');
  assert.equal(url.pathname, '/api/schedules/assigned-to-me');
  assert.deepEqual([...url.searchParams.keys()].sort(), ['page', 'size', 'status']);
  assert.equal(url.searchParams.get('status'), 'CLOSED');
  assert.equal(url.searchParams.get('page'), '1');
  await scheduleApi.assignedDetail(42);
  assert.equal(calls[1].path, '/api/schedules/assigned-to-me/42');
});
test('revoked guide assignment remains a forbidden error', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Không còn được phân công' }, { status: 403 });
  await assert.rejects(() => scheduleApi.assignedDetail(42), (e: any) => e.status === 403);
});


test('my tickets use the principal-scoped route with bounded pagination', async () => {
  await participantApi.mine(2);
  const url = new URL(calls[0].path, 'http://localhost');
  assert.equal(url.pathname, '/api/participants/me');
  assert.deepEqual([...url.searchParams.keys()].sort(), ['page', 'size']);
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(url.searchParams.get('size'), '20');
});

test('history and review requests use canonical resources and preserve filters', async () => {
  await scheduleApi.histories(8, 1);
  await participantApi.histories(4, 2);
  await participantApi.reviews(3, 0);
  const urls = calls.map(c => new URL(c.path, 'http://localhost'));
  assert.deepEqual(urls.map(u => u.pathname), ['/api/schedules/8/history', '/api/participants/4/history', '/api/schedule-payment-reviews']);
  assert.equal(urls[0].searchParams.get('page'), '1');
  assert.equal(urls[1].searchParams.get('page'), '2');
  assert.equal(urls[2].searchParams.get('branchId'), '3');
});
