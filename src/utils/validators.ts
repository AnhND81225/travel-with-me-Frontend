/**
 * Common validation utilities for TerraPeak Outpost
 */

export function validateRentalPeriod(startDateStr: string, endDateStr: string): { isValid: boolean; error?: string } {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid dates provided.' };
  }
  if (start < now) {
    return { isValid: false, error: 'Start date cannot be in the past.' };
  }
  if (end <= start) {
    return { isValid: false, error: 'End date must be after the start date.' };
  }
  return { isValid: true };
}

export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}
