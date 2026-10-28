# Trang chi tiết tour — desktop

Nhánh `feature/tour-detail-redesign`, chỉnh trực tiếp `ExpeditionDetailPage` và phần trình bày `BookingPanel`.

- Giữ route `/tours/:id`, `/expeditions/:id`, query `schedule`, API và model hiện có. Giữ giá, quyền CUSTOMER, điều kiện bookable, gửi đăng ký và chuyển đến vé trong BookingPanel.
- Hero dùng ảnh/nội dung từ API; ảnh thiếu/lỗi có trạng thái trung thực, không thay bằng ảnh tour mẫu. Tiêu đề đậm, forest green/beige, nhấn cam tiết chế.
- Desktop chia 68/32 với sidebar sticky, booking xanh rừng, chữ sáng, nút cam nhạt và lịch được chọn trên nền sáng.
- Ba tab Itinerary/Specifications/Equipment: hash trong URL, điều hướng ArrowLeft/Right/Home/End, giữ query schedule. Hash cũ `#specs` vẫn mở Specifications.
- Một bộ phân trang ngày: nút Ngày 1, Ngày 2… kèm tên chặng, aria-pressed, cuộn ngang nếu nhiều ngày; không còn dropdown hoặc nút trước/sau trùng.
- Timeline tận dụng chiều ngang: tên/địa điểm bên trái, mô tả mở sẵn bên phải bằng details có thể thu gọn. Chỉ dùng nội dung thật từ itinerary.
- Trang bị bắt buộc và khuyến nghị tách nhóm theo required.
- Trạng thái tải/lỗi/trống/còn chỗ/đủ chỗ của lịch có hướng dẫn và nút thử lại. Giữ các API/hooks hiện có; không hiện thông báo kỹ thuật kết thúc phân trang cho khách.

## Xác minh

- `npm run lint` (TypeScript), `npm run test:tour-guide` (10), `npm run test:module5` (18), `npm run test:navigation` (4) và production build PASS. Cảnh báo bundle lớn hiện hữu còn tồn tại.
- Browser desktop: ba tab, phím điều hướng tab, chuyển Ngày 1/2, trạng thái chọn ngày, nội dung/mô tả, một bộ điều hướng ngày và không tràn ngang.
- Preview local dùng backend thật với DB local riêng `tour_detail_ui_20261028`; nội dung tour Tà Năng được sao chép từ response API đã có để kiểm tra, lịch tương lai là fixture local. Không mock API trong source, không ghi Supabase, không gửi mail hay gọi thanh toán thật.
- Kiểm tra trực quan lịch còn chỗ/đủ chỗ và liên kết đăng nhập; chưa xác minh đầy đủ lượt tạo vé qua browser.
- Tablet/mobile chưa kiểm thử theo yêu cầu người dùng; CSS responsive cơ bản được giữ.
- 2026-10-28: lưu redesign trong commit d17ff60; fetch và merge origin/main mới nhất 2a47e35 qua merge commit 7d23dc8, không có conflict. Sau merge: TypeScript, 32 tests và production build PASS; chỉ còn cảnh báo bundle lớn hiện hữu. Nhánh giao nhận: feature/tour-detail-redesign; không merge vào main.
