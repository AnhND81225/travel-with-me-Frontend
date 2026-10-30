import test from 'node:test';
import assert from 'node:assert/strict';
import { moneyScale } from './chartScale';
test('mixed positive and negative amounts use round evenly spaced ticks containing zero', () => {
  const scale = moneyScale([-1810000, 4200000, 123456]);
  assert.deepEqual(scale.ticks, [-2000000, 0, 2000000, 4000000, 6000000]);
  assert.equal(scale.unit, 'Triệu đồng');
  assert.deepEqual(scale.ticks.map(scale.format), ['-2', '0', '2', '4', '6']);
});
test('all ticks share the same unit around thousand and million boundaries', () => {
  const scale = moneyScale([-900000, 1200000]);
  assert.equal(scale.unit, 'Triệu đồng');
  assert.equal(scale.format(500000), '0,5');
  assert.ok(scale.ticks.every((value, index) => index === 0 || value - scale.ticks[index - 1] === scale.step));
});
test('zero, all-negative, small and billion values keep a valid encompassing range', () => {
  for (const values of [[0], [-900, -300], [5, 12], [1e9, 3.1e9], [NaN, Infinity, 0]]) {
    const scale = moneyScale(values);
    assert.ok(scale.max > scale.min);
    assert.ok(scale.ticks.includes(0));
    for (const value of values.filter(Number.isFinite)) assert.ok(value >= scale.min && value <= scale.max);
  }
});
