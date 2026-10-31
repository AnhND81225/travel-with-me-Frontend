/** Round outward to equal 1/2/5 × power-of-ten steps, always keeping zero on the axis. */
export function moneyScale(values: number[]) {
  let low = 0, high = 0;
  for (const value of values) if (Number.isFinite(value)) { low = Math.min(low, value); high = Math.max(high, value); }
  const rawStep = Math.max(1, (high - low) / 5);
  const power = 10 ** Math.floor(Math.log10(rawStep));
  const step = ([1, 2, 5, 10].find(multiplier => multiplier * power >= rawStep) || 10) * power;
  const minIndex = Math.floor(low / step), maxIndex = Math.max(minIndex + 1, Math.ceil(high / step));
  const ticks = Array.from({ length: maxIndex - minIndex + 1 }, (_, index) => (minIndex + index) * step);
  const min = ticks[0], max = ticks[ticks.length - 1];
  const magnitude = Math.max(Math.abs(min), Math.abs(max));
  const divisor = magnitude >= 1e9 ? 1e9 : magnitude >= 1e6 ? 1e6 : magnitude >= 1e3 ? 1e3 : 1;
  const unit = divisor === 1e9 ? 'Billion VND' : divisor === 1e6 ? 'Million VND' : divisor === 1e3 ? 'Thousand VND' : 'VND';
  const digits = Math.min(6, Math.max(0, Math.ceil(-Math.log10(step / divisor))));
  const formatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: digits });
  return { min, max, step, ticks, unit, format: (value: number) => formatter.format(value / divisor) };
}
