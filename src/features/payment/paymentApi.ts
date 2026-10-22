import { ApiError } from '../equipment/catalogApi';

/** Payment returns must retain FE authentication; Swagger's bearer token is separate. */
export async function paymentApi<T>(path: string, init: RequestInit = {}, allowEmpty = false): Promise<T> {
  const token = sessionStorage.getItem('treektour.catalog.token');
  if (!token) throw new ApiError('Vui lòng đăng nhập tài khoản đã thanh toán để xác minh giao dịch.', 401);
  let response: Response;
  try {
    response = await fetch('/api' + path, {
      ...init,
      // API authentication must return an error, not silently navigate fetch to Google login.
      redirect: 'error',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
    });
  } catch {
    throw new Error('Không kết nối được API xác minh. Kiểm tra backend đang chạy; nếu phiên đăng nhập hết hạn, đăng nhập lại rồi kiểm tra giao dịch.');
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status === 401 || response.status === 403
      ? 'Phiên đăng nhập không hợp lệ hoặc tài khoản không sở hữu giao dịch. Hãy đăng nhập đúng tài khoản đã thanh toán.'
      : payload?.message || `Không thể xác minh giao dịch (${response.status}).`, response.status);
  }
  if (!payload?.data && !allowEmpty) throw new Error('API chưa trả dữ liệu xác minh. Kiểm tra cấu hình proxy /api tới backend.');
  return payload.data as T;
}
