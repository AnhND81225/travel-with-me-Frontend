/**
 * Common formatting utilities for TerraPeak Outpost
 */

// Legacy mock prices are denominated in demo units. Keep calculations unchanged,
// and localize their display consistently. This is fixed fixture pricing, not live FX.
export const DEMO_VND_PER_UNIT = 25_000;
export function formatCurrency(amount: number): string {
  return (
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      Math.round(amount * DEMO_VND_PER_UNIT),
    ) + " ₫"
  );
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} KG`;
  }
  return `${grams} G`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatHoursRemaining(hours: number): string {
  if (hours <= 0) return "OVERDUE";
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days > 0) {
    return `${days}d ${remainingHours}h remaining`;
  }
  return `${hours}h remaining`;
}

export function generateOrderNumber(prefix = "TK"): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${randomNum}`;
}
