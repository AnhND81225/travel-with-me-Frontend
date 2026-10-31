import { useState } from 'react';
import { moneyScale } from './chartScale';
export const chartColors = ['#1f5138', '#d97845', '#7192a0', '#977abd', '#b3984f', '#488a80', '#b46b7a', '#6978b1', '#7e9152', '#a17651', '#71837e', '#a7a28b'];
export const money = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
const compact = (value: number) => new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
export type ChartSeries = { name: string; color: string; values: number[] };
export function ReportChart({ labels, series, kind = 'line', scaleValues }: { labels: string[]; series: ChartSeries[]; kind?: 'line' | 'bar'; scaleValues?: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!labels.length || !series.length || !series.some(s => s.values.some(v => v !== 0))) return <div className="rp-empty">No chart data for the selected period.</div>;
  const width = 820, height = 300, left = 64, right = 18, top = 22, bottom = 40;
  const axis = moneyScale(scaleValues ?? series.flatMap(s => s.values));
  const { min, max } = axis;
  const y = (v: number) => top + (max - v) / (max - min) * (height - top - bottom);
  const step = (width - left - right) / Math.max(labels.length, 1);
  const x = (i: number) => left + step * (i + .5);
  return <div className="rp-chart-wrap"><div className="rp-legend">{series.map(s => <span key={s.name}><i style={{ background: s.color }}/>{s.name}</span>)}</div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Chart ${series.map(s => s.name).join(', ')}; ${labels.length} periods`} onMouseLeave={() => setHover(null)}>
    <text x={left} y={11} className="rp-axis-unit">{axis.unit}</text>
    {axis.ticks.map(v => <g key={v}><line x1={left} x2={width - right} y1={y(v)} y2={y(v)} stroke="#e7e2d6" strokeDasharray="3 4"/><text x={left - 10} y={y(v) + 4} textAnchor="end">{axis.format(v)}</text></g>)}
    <line x1={left} x2={width - right} y1={y(0)} y2={y(0)} stroke="#b7c1b1"/>
    {series.map((s, j) => kind === 'line' ? <g key={s.name}><polyline fill="none" stroke={s.color} strokeWidth="2.5" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}/>{s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={labels.length > 60 ? 1 : 3} fill={s.color}><title>{labels[i]} · {s.name}: {money(v)}</title></circle>)}</g> : <g key={s.name}>{s.values.map((v, i) => <rect key={i} x={left + step * i + step * .13 + j * step * .74 / series.length} width={step * .74 / series.length * .85} y={Math.min(y(v), y(0))} height={Math.max(0, Math.abs(y(v) - y(0)))} rx="2" fill={s.color}><title>{labels[i]} · {s.name}: {money(v)}</title></rect>)}</g>)}
    {labels.map((label, i) => <g key={i}><rect x={left + step * i} y={top} width={step} height={height - top - bottom} fill="transparent" onMouseEnter={() => setHover(i)}/>{i % Math.max(1, Math.ceil(labels.length / 8)) === 0 && <text x={x(i)} y={height - 13} textAnchor="middle"><title>{label}</title>{label.length > 18 ? label.slice(0, 16) + '…' : label}</text>}</g>)}
    {hover !== null && hover < labels.length && <line x1={x(hover)} x2={x(hover)} y1={top} y2={height - bottom} stroke="#7e8b77" strokeDasharray="4 4" pointerEvents="none"/>}
  </svg><div className="rp-chart-detail" aria-live="polite">{hover !== null && labels[hover] ? <><strong>{labels[hover]}</strong>{series.map(s => <span key={s.name} style={{ color: s.color }}>{s.name}: {money(s.values[hover] || 0)}</span>)}</> : <span>Hover over the chart for details. Currency: VND.</span>}</div></div>;
}
export function BranchBars({ rows }: { rows: { id: number; name: string; netAmount: number }[] }) {
  const max = Math.max(1, ...rows.map(row => Math.abs(row.netAmount)));
  return rows.length ? <div className="rp-branch-bars">{rows.map(row => <div key={row.id}><div><span>{row.name}</span><strong>{money(row.netAmount)}</strong></div><div className="rp-bar-track"><div style={{ width: `${Math.abs(row.netAmount) / max * 100}%`, background: row.netAmount < 0 ? '#b64c3b' : '#52724b' }}/></div></div>)}</div> : <div className="rp-empty">No successful transactions yet.</div>;
}
export function SectorDonut({ rows }: { rows: { name: string; receivedAmount: number }[] }) {
  const total = rows.reduce((sum, row) => sum + row.receivedAmount, 0);
  if (!total) return <div className="rp-empty">No payments received in this period.</div>;
  let start = 0;
  return <div className="rp-donut"><svg viewBox="0 0 140 140" role="img" aria-label="Equipment and tour payment share"><circle cx="70" cy="70" r="52" fill="none" stroke="#e8e4d9" strokeWidth="18"/>{rows.map((row, index) => {
    const fraction = row.receivedAmount / total; const offset = start; start += fraction;
    return <circle key={row.name} cx="70" cy="70" r="52" fill="none" stroke={chartColors[index]} strokeWidth="18" strokeDasharray={`${fraction * 326.73} 326.73`} strokeDashoffset={-offset * 326.73} transform="rotate(-90 70 70)"><title>{row.name}: {money(row.receivedAmount)}</title></circle>;
  })}<text x="70" y="66" textAnchor="middle">TOTAL RECEIVED</text><text x="70" y="84" textAnchor="middle" className="rp-donut-total">{compact(total)}</text></svg><div>{rows.map((row, i) => <div className="rp-donut-row" key={row.name}><i style={{ background: chartColors[i] }}/><span>{row.name === 'TOUR' ? 'Tour ticket' : 'Equipment'}<small>{money(row.receivedAmount)}</small></span><strong>{(row.receivedAmount / total * 100).toFixed(1)}%</strong></div>)}</div></div>;
}

export function EntityTrend({ entities, points, label, dates }: { entities: { id: number; name: string }[]; points: { date: string; id: number; value: number }[]; label: string; dates: string[] }) {
  const [chosen, setChosen] = useState<number[]>(entities.slice(0, 3).map(item => item.id));
  const selected = entities.filter(item => chosen.includes(item.id));
  return <><div className="rp-entity-select" role="group" aria-label="Select items to compare">{entities.map(item => <button type="button" key={item.id} aria-pressed={chosen.includes(item.id)} disabled={!chosen.includes(item.id) && chosen.length >= 6} onClick={() => setChosen(old => old.includes(item.id) ? old.filter(id => id !== item.id) : [...old, item.id])}>{item.name}</button>)}</div><p className="rp-hint">Select up to 6 items to compare · {label}</p><ReportChart labels={dates.map(date => date.slice(5).split('-').reverse().join('/') + '/' + date.slice(0, 4))} series={selected.map((entity, index) => ({ name: entity.name, color: chartColors[index], values: dates.map(date => points.filter(point => point.date === date && point.id === entity.id).reduce((sum, point) => sum + point.value, 0)) }))}/></>;
}
