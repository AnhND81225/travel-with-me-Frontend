

Thiết bị & tồn kho: xem [EQUIPMENT_INTEGRATION.md](EQUIPMENT_INTEGRATION.md) để chạy với backend và kiểm tra phạm vi API thật.

Module 5 — luồng thanh toán tour: CUSTOMER đặt vé (PENDING) → Pay with ZaloPay → backend xác minh thanh toán và vé còn hợp lệ → CONFIRMED → ADMIN/STAFF đóng đăng ký → GUIDE điểm danh → ADMIN/STAFF bắt đầu và hoàn tất chuyến đi theo thời gian. Roster không còn bước Confirm Receipt hoặc nhập mã chứng từ thủ công. Giao dịch đã nhận tiền nhưng vé chưa được xác nhận cần kiểm tra kết quả/đối soát, không tự đổi trạng thái vé ở frontend. Endpoint xác nhận thủ công cũ vẫn được giữ ở backend để tương thích; frontend không gọi endpoint này trong luồng vận hành.
