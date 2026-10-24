# Thiết bị và tồn kho — nối backend

Chạy backend Spring Boot ở localhost:8080 trước. Tại thư mục frontend:

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Mở http://localhost:3000/shop. Trang thuê `/rent`, chi tiết `/gear/:id`, đăng nhập `/login`, quản lý `/admin/catalog`, thêm `/admin/catalog/new`, sửa `/admin/catalog/:id/edit`, kho `/admin/inventory` và `/staff/inventory`.

Vite chuyển `/api` tới http://127.0.0.1:8080. Đổi backend bằng biến môi trường BACKEND_URL trước khi khởi động Vite. Production cần cấu hình reverse proxy `/api` đến Spring Boot; frontend không chứa DB password hoặc secret backend.

Module `src/features/equipment` gọi API thật, hiển thị VND, có phân trang, trạng thái tải/lỗi/rỗng. Phiên JWT nằm trong sessionStorage của tab, không lưu mật khẩu; đăng xuất xóa token. Mỗi lần mở trang quản lý đều xác thực `/api/users/me`. Quyền ADMIN/STAFF và chi nhánh do backend kiểm tra, không dùng bộ chọn role giả trong Zustand để cấp quyền.

Danh sách sản phẩm chỉ hiển thị ACTIVE; quản trị có thêm/sửa và ngừng/mở lại. Kho có nhập thêm, kiểm kê giữ nguyên số đang thuê, tạm dừng/mở lại. STAFF chọn chi nhánh được phân công; chi nhánh khác bị API từ chối. Tra cứu ngày thuê không giữ chỗ.

Các trang tour, giỏ hàng/checkout, bảng điều khiển tổng quan và nghiệp vụ module khác vẫn thuộc bản mock hiện có. Đặt thuê trực tiếp trên trang chi tiết qua POST /api/inventory/rentals; backend xác định người đặt và giá, kiểm tra tồn kho dưới khóa product rồi tạo đơn PENDING. Giỏ mock không dùng cho luồng này; chưa nối thanh toán và giao/nhận trả. Các entry mua/thuê đã nối trong thay đổi này là `/shop`, `/rent`, `/catalog`, `/gear/:id`; phần sản phẩm quảng bá ở HomePage vẫn là dữ liệu demo của nhóm.

Kiểm tra:
```sh
npm run lint
npm run build
```

Dùng npm/package-lock.json cho bản tích hợp này. esbuild đã chỉnh sang 0.28.x để phù hợp peer dependency Vite 8; bun.lock gốc chưa đồng bộ nên không dùng frozen Bun install cho thay đổi này.
## Cập nhật 2026-10-24
Trang chi tiết tự tra lượng có thể đặt khi chọn Pickup branch hoặc thay đổi ngày nhận/ngày trả; không cần bấm kiểm tra riêng. Ngày mặc định là hôm nay; đổi ngày nhận sẽ đẩy ngày trả lên nếu cần. Kết quả cũ không hiển thị trong khi truy vấn mới đang tải. Request cũ được hủy khi đổi lựa chọn; có trạng thái hết hàng, ngày không hợp lệ và nút thử lại khi lỗi.

Chọn số lượng rồi bấm Đặt thuê ngay. Nếu chưa đăng nhập, trang giữ chi nhánh/ngày/số lượng qua đăng nhập. Thành công hiển thị mã đơn thật, tổng tiền, trạng thái chờ xử lý và cập nhật số còn đủ. Ngày thuê tính cả ngày nhận lẫn ngày trả. Lỗi thiếu kho sẽ tải lại số lượng để chọn lại. Endpoint Order cũ vẫn cần nhóm Order áp dụng cùng khóa/validation cho mọi đường ghi.
