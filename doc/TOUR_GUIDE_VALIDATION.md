# Validation FE tour và guide

Nhánh: `feature/tour-guide-fe-validation`, dựa trên FE `19d2809`.

## Phạm vi

- Tạo/sửa tour tại `/admin/events-guides`, lịch trình từng ngày và checklist.
- GUIDE tạo/sửa tại `/admin/staff` là giao diện đang dùng. Các form guide cũ trong component tour cũng dùng cùng validator.
- Phần STAFF tại trang nhân sự giữ form native và luồng API cũ. Chỉ nhánh GUIDE bật CatalogForm; có test kiểm tra STAFF không gọi validator GUIDE.
- Không đổi API client dùng chung của module khác, endpoint, BE source hoặc database schema.

## Quy tắc

- Tên tour bắt buộc, tối đa 200 ký tự; giá không âm, hữu hạn, tối đa 16 chữ số phần nguyên/2 số lẻ. Ô giá trống không tự biến thành 0.
- Nháp được thiếu mô tả, tỉnh/thành, thời lượng và yêu cầu tham gia. Nếu nhập thời lượng phải là số nguyên dương nằm trong miền Integer của BE. Tour đang công bố phải có đủ mô tả, tỉnh/thành, độ khó, thời lượng, điểm tập trung, yêu cầu. Khi công bố, kiểm tra thêm ảnh qua GET admin; BE vẫn kiểm tra lại trạng thái thực.
- Tối đa 30 ngày, ngày liên tục; 20 điểm nổi bật/ngày, 300 ký tự/ý; 50 hoạt động/ngày; 100 trang bị. Tên chặng, thời gian/tên hoạt động và tên trang bị không được trắng. Các giới hạn chuỗi khác theo DTO BE.
- Không tự cắt bớt điểm nổi bật; báo lỗi để người nhập sửa. Xóa ngày tự đánh lại thứ tự.
- Guide: họ tên 150, email 255, điện thoại 30, chuyên môn 1.000, bio 5.000 ký tự; kinh nghiệm là số nguyên không âm; tối đa 10 ngôn ngữ, mỗi mục 50 ký tự. Email kiểm tra định dạng cơ bản, BE quyết định email trùng và validation cuối cùng.
- Khi sửa guide trên trang nhân sự, kiểm tra cả thông tin tài khoản trước khi gọi hai API đang có. Hai API vẫn là hai giao dịch riêng theo thiết kế hiện tại; FE không tạo giao dịch nguyên tử thay BE.
- Ảnh: tối đa 5 MiB, không rỗng, JPEG/PNG/WebP và chữ ký đầu tệp khớp MIME. BE và Cloudinary tiếp tục kiểm tra nội dung đầy đủ.

## Trải nghiệm lỗi

Lần submit đầu kiểm tra và báo lỗi tiếng Việt ngay dưới ô nhập, không lặp lại lỗi trường nhập trong khung tổng hợp ở đầu form. Chỉ lỗi chung hoặc lỗi BE không ánh xạ được về ô nhập mới hiện thông báo trong modal. Sau đó lỗi được cập nhật theo dữ liệu sửa. Các input có `aria-invalid`, `aria-describedby`, tên trường tương ứng DTO; focus vào ô lỗi đầu tiên theo thứ tự trên form. Modal tạo tour có cuộn riêng trên màn hình nhỏ.

Lỗi `data.fieldErrors` của BE được gắn lại đúng input, bao gồm lịch trình lồng nhau. Lỗi danh sách highlights/languages quy về textarea/input tương ứng. Email trùng hiện tại ô email, lỗi đăng nhập/quyền/mạng có hướng dẫn. Form giữ dữ liệu khi request lỗi, ngăn submit lặp trong lúc request đang chờ. Việc thêm/xóa phần tử xóa lỗi server cũ để tránh gắn lỗi nhầm chỉ số.

## Kiểm thử

```sh
npm run test:tour-guide
npm run lint
npm run build
```

- 10 tests validation/render PASS, bao gồm biên số/chuỗi/danh sách, tương thích nháp/công bố, lỗi BE, chữ ký file, guard tách GUIDE khỏi STAFF.
- TypeScript và build PASS; Vite vẫn có cảnh báo bundle lớn hiện hữu.
- Browser với BE `04dfea1` chạy trên PostgreSQL local riêng `tour_fe_validation_20261027`: tour sai bị chặn, focus đúng ô; bản nháp tối thiểu tạo thành công; GUIDE sai bị chặn; email trùng từ BE hiện tại email và giữ form; sửa guide hợp lệ lưu kinh nghiệm/ngôn ngữ và kiểm trực tiếp DB.
- Guide dùng để thử sửa được tạo bằng fixture local, không đăng ký tài khoản mới qua email. Không gửi mail thật, gọi Cloudinary thật hay ghi Supabase chung trong lượt kiểm thử.
- Kiểm thử browser là thao tác thủ công bằng công cụ; không phải toàn bộ E2E đã tự động hóa. Các trạng thái lỗi mạng/401/403 và giới hạn danh sách lớn có test logic; không khẳng định đã tái hiện mọi trạng thái bằng UI.
