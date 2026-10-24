import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicNavigation, roleNavigation } from './navigation';

const destinations = (role?: string) => roleNavigation(role).map(([to]) => to);

test('guests and unknown roles never receive account or workspace destinations', () => {
  for (const role of [undefined, '', 'UNKNOWN']) assert.deepEqual(destinations(role), []);
  assert.deepEqual(publicNavigation.map(([to]) => to), ['/', '/shop', '/tours']);
});
test('customers see their orders and tours without operational consoles', () => {
  assert.deepEqual(destinations('CUSTOMER'), ['/orders', '/my-tours']);
});
test('guides see assignments without customer tickets or management destinations', () => {
  assert.deepEqual(destinations('GUIDE'), ['/guide/schedules']);
});
test('staff never see the admin console; admin can access both consoles', () => {
  assert.deepEqual(destinations('STAFF'), ['/staff']);
  assert.deepEqual(destinations('ADMIN'), ['/admin', '/staff']);
});
