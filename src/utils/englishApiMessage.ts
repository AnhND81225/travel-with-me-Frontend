/** Keep API errors readable in the English interface without changing status codes. */
export function englishApiMessage(message: string, status?: number): string {
  if (!/[\u00c0-\u1ef9]/i.test(message)) return message;
  const known: [RegExp, string][] = [
    [/Vé có giao dịch cũ/i, 'This ticket has an existing payment. Check the previous ticket payment result or contact the branch before booking again.'],
    [/hết chỗ|đủ chỗ|đã đầy/i, 'This departure is fully booked. Please choose another departure.'],
    [/email.*(đã|trùng|tồn tại)/i, 'This email is already in use. Please use another email.'],
    [/mật khẩu.*(sai|không đúng)|sai.*mật khẩu/i, 'Incorrect password. Please try again.'],
    [/không còn được phân công/i, 'You are no longer assigned to this departure. Please refresh your assignments.'],
    [/cần đăng nhập|chưa đăng nhập|phiên.*hết hạn/i, 'Please sign in again to continue.'],
    [/không có quyền/i, 'You do not have permission to perform this action.'],
  ];
  for (const [pattern, translation] of known) if (pattern.test(message)) return translation;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'This record is unavailable. Please refresh the page.';
  if (status === 409) return 'This action conflicts with the current record. Refresh the page and check availability or payment details before trying again.';
  if (status && status >= 500) return 'The service is temporarily unavailable. Please try again later.';
  return 'Unable to complete this action. Check the entered details and the latest record, or contact the branch for assistance.';
}
