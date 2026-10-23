const STORAGE_KEY = 'terrapeak_pwd_change_required_emails';

export function getPendingPasswordChangeEmails(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((e) => String(e).toLowerCase().trim()) : [];
  } catch {
    return [];
  }
}

export function markAccountRequiresPasswordChange(email: string): void {
  if (!email) return;
  const normalized = email.toLowerCase().trim();
  const current = getPendingPasswordChangeEmails();
  if (!current.includes(normalized)) {
    current.push(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore storage quota errors
    }
  }
}

export function doesAccountRequirePasswordChange(email?: string): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const current = getPendingPasswordChangeEmails();
  return current.includes(normalized);
}

export function clearAccountPasswordChangeRequirement(email?: string): void {
  if (!email) return;
  const normalized = email.toLowerCase().trim();
  const current = getPendingPasswordChangeEmails();
  const updated = current.filter((e) => e !== normalized);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
