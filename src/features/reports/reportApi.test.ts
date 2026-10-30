import test from 'node:test';
import assert from 'node:assert/strict';
import { reportApi, reportDates, reportQuery, validateFilters, type Filters } from './reportApi';
const filters: Filters = { from: '2026-10-01', to: '2026-10-31', period: 'DAY', branchId: '2', sector: 'EQUIPMENT', paymentMethod: 'MANUAL', productId: '1', tourId: '3', scheduleId: '4' };
test('product requests exclude cash and tour filters', () => {
  const query = reportQuery(filters, 'products');
  assert.equal(query.get('productId'), '1');
  for (const key of ['sector', 'paymentMethod', 'tourId', 'scheduleId']) assert.equal(query.has(key), false);
});
test('tour report and its CSV/detail filters always restrict to TOUR', () => {
  const query = reportQuery(filters, 'tours');
  assert.equal(query.get('sector'), 'TOUR'); assert.equal(query.get('tourId'), '3');
  assert.equal(query.get('scheduleId'), '4'); assert.equal(query.has('productId'), false);
});
test('overview ignores stale product and tour selections', () => {
  const query = reportQuery(filters, 'overview');
  assert.equal(query.get('sector'), 'EQUIPMENT');
  assert.equal(query.has('productId'), false); assert.equal(query.has('tourId'), false);
});
test('dates fill missing days/months without shifting timezones', () => {
  assert.equal(reportDates(filters).length, 31);
  assert.deepEqual(reportDates({ from: '2026-09-15', to: '2026-10-01', period: 'MONTH' }), ['2026-09-01', '2026-10-01']);
});
test('invalid ranges and ids are rejected before requesting report', () => {
  assert.equal(validateFilters(filters), '');
  assert.ok(validateFilters({ ...filters, to: '2026-09-30' }));
  assert.ok(validateFilters({ ...filters, to: '2027-12-01' }));
  assert.ok(validateFilters({ ...filters, productId: '-1' }));
});
test('report fetch uses shared bearer, respects abort and errors instead of mock data', async () => {
  const oldFetch = globalThis.fetch;
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => 'demo-jwt' } });
  const controller = new AbortController();
  try {
    globalThis.fetch = (async (url, init) => {
      assert.ok(String(url).includes('/api/reports/revenue/tours?'));
      assert.ok(String(url).includes('sector=TOUR'));
      assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer demo-jwt');
      assert.equal(init?.signal, controller.signal);
      return new Response(JSON.stringify({ data: { tours: [], series: [], schedules: [] } }), { status: 200 });
    }) as typeof fetch;
    assert.deepEqual(await reportApi.tours(filters, controller.signal), { tours: [], series: [], schedules: [] });
    globalThis.fetch = (async () => new Response(JSON.stringify({ message: 'Denied' }), { status: 403 })) as typeof fetch;
    await assert.rejects(reportApi.overview(filters), /ADMIN/);
    globalThis.fetch = (async () => new Response(JSON.stringify({ data: null }), { status: 200 })) as typeof fetch;
    await assert.rejects(reportApi.overview(filters), /không trả dữ liệu/);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldStorage) Object.defineProperty(globalThis, 'sessionStorage', oldStorage);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});
