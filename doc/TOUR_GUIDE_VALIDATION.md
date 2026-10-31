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

## FE language update — 2026-10-31

Branch: `feature/tour-fe-english`.

- Tour catalog/detail, tour content editor, administration forms, accessible labels, validation and notifications now use English.
- On the shared personnel page, GUIDE cards, actions, credentials and create/edit/deactivate dialogs use English. Shared labels switch to English when viewing the GUIDE tab or editing a GUIDE; STAFF copy and request behavior remain unchanged.
- Province names and all content received from the API remain unchanged. Existing endpoints, payloads, routes, validation limits and booking behavior are preserved. Currency values remain VND; the tour pages format them with the English locale.
- Backend review work was withdrawn after the user limited this task to FE. No review endpoint, migration, mock reviews or inactive review form is included. The backend worktree is clean.
- Verification: `npm run test:tour-guide` (10/10), `npm run lint` (TypeScript), `npm run build`, and `git diff --check` passed. The production build still reports the existing chunk-size warning. No browser E2E, shared-database writes or provider calls were performed for this language update.

## Tour detail editorial design — 2026-10-31

Branch: `feature/tour-detail-editorial`, preserving the preceding English UI changes.

- Replaced the tour-detail body with editorial serif headings, warm ivory/forest-green styling, a real-image gallery with native accessible lightbox, a 68:32 content/booking layout and desktop sticky booking panel. Existing site header/footer are untouched.
- Added three hash-based information views (Itinerary, Specifications, Equipment), retained legacy `#specs`, preserved the `schedule` query parameter, and kept one day selector. Activities use a compact timeline with expandable descriptions; required/recommended equipment uses the existing `required` field.
- The gallery uses existing tour images/cover only. Multiple real images enable the mosaic and an itinerary gallery photo; one image remains a full-width cover, and zero images has an explicit empty state. No generated concept photos, invented guides, guest counts, reviews or API fields were inserted. Day photos are labelled as tour gallery images, without claiming a day-specific association.
- `BookingPanel` and its API, registration, role/availability guards, per-account reservation rule and dialog are reused without source changes. Visual overrides are scoped to this page. Backend source, schema and shared data are unchanged.
- Verification: TypeScript/lint, all configured tests (10 tour/guide, 21 schedule/API/rules, 4 navigation), production build and diff whitespace checks passed. Existing Vite chunk-size warning remains.
- Desktop browser verification at 1440×1000 on actual tour 60: live tour API, loaded image, day 1/2 content, three information views, required/recommended checklist, photo lightbox autofocus, Escape/focus restoration and no horizontal overflow. Verified the actual no-departures state and sign-in booking link. Tour 60 has one image and no departures; multiple-photo interactions, successful authenticated reservations, tablet/mobile and all failure states were not browser-tested. No test registration, provider call or shared database write was made.

## Choose tour photos before creation — 2026-10-31

- Added `TourImagePicker` to the create-tour form: multiple validated images, local previews, cover selection, explicit earlier/later ordering and removal before saving. Object URLs are revoked on removal/unmount. Selection validation blocks submit while pending.
- Existing backend uses ascending image IDs and the first image as cover. Creation therefore saves the draft once, then uploads files sequentially in the chosen order through existing endpoints. No backend/schema or upload contract changes.
- A partial upload retains the created draft ID, successful upload count and remaining files. Submitting again updates the same draft and resumes pending uploads. Already saved photos are not deleted/reuploaded to simulate reordering. Controls block edits to the pending queue while saving.
- This controls the cover and gallery order of NEW tours. Reordering existing saved images and assigning photos to individual itinerary days remain unsupported by the current API; the picker does not claim to persist those placements.
- Verification: existing 10 tour/guide validation and native STAFF isolation tests, TypeScript, production build and diff whitespace checks passed; existing bundle-size warning remains. Actual Cloudinary uploads and partial-failure recovery were not executed against shared data. No production tour or images were created for verification.

## Persisted photo layout — 2026-10-31

Branch: `feature/tour-image-layout` (includes the preceding uncommitted FE work).

The earlier API limitation is now resolved by the matching member 4 backend branch and `V2026103101__tour_image_layout.sql`. `PUT /api/admin/events/{eventId}/images/layout` accepts the complete ordered image ID/day assignment list. Image responses add `sortOrder`, `dayNumber`, `cover` without removing existing fields.

- Create form adds optional day assignment per selected file; after saving/uploading it saves the layout. Known uploaded image IDs are retained for a layout-save retry without recreating the draft. Day assignments to removed itinerary days are cleared before submission.
- Existing image library supports cover selection, earlier/later ordering, per-day assignment, explicit save and discard/reload. Upload/delete are blocked while unsaved layout exists; archived libraries are read-only. Stale library fetches are ignored after closing/switching tours.
- Public tour detail uses only explicit day assignments; multiple images for a day are supported. Photos remain in the main gallery in backend order. Header/footer and member 5 booking source remain unchanged.
- Verified 36 FE tests (11 tour/guide/API, 21 schedule/API/rules, 4 navigation), lint/TypeScript, production build and diff whitespace checks. Existing bundle warning remains.
- Live browser/API/DB check on an isolated backend (8084) and FE (3004): local ADMIN changed cover/day and saved through the real endpoint; DB rows and public GET matched; Day 2 rendered two assigned photos. The local fixture uses existing public photo URLs. No actual Cloudinary upload or write to the shared database was performed. Tablet/mobile and upload-failure browser flows remain unverified.

The existing main backend on port 8080 also auto-reloaded after compilation. A read-only GET of tour 60 now returns HTTP 200 with the added image metadata, so the existing FE on 3003 can use the new API. No manual shared-database SQL was run; migrations are managed by application startup/Flyway.

## Compact itinerary and Nunito — 2026-10-31

- Loaded Nunito through the existing Google Fonts stylesheet and scoped it to tour detail/lightbox, including headings and the booking-panel presentation. Site header/footer font and layout remain unchanged.
- Removed the fixed detail-section minimum height, tightened section/day/timeline spacing, and increased activity-title weight. When a day has no assigned photos, activity content uses the full width: title/location on the left, expandable real descriptions open by default on the right. Days with assigned photos retain the image column. No filler content, invented images or API changes.
- Constrained desktop gallery row height so intrinsic preview-image dimensions cannot stretch the gallery or leave a blank area under the cover.
- TypeScript/lint, production build and diff whitespace checks passed. Desktop browser on the actual tour 60 at port 3000 verified Nunito loaded (including Vietnamese), three initially open descriptions and no horizontal overflow. Existing Vite bundle-size warning remains. No additional automated tests were added for these presentation-only edits.

## Centered gallery dialog — 2026-10-31

- Restored explicit fixed positioning, `inset: 0` and `margin: auto` for the native tour photo dialog; Tailwind's margin reset had removed the browser's default dialog centering.
- Bounded the dialog to the viewport with a grid image area, contained image scaling and a centered, horizontally scrollable thumbnail strip. Close control and counter remain inside the dialog. This only affects `.td-lightbox` and its children.
- TypeScript/lint, production build and diff whitespace checks passed. Desktop browser at 1440×1000 verified vertical centering, full five-photo strip and matched 460px cover/preview gallery heights; also checked photo selection, Escape and centering at 1920×1080. Header/footer, API and backend are unchanged. Existing bundle warning remains.

## Remove decorative expedition number — 2026-10-31

Removed the decorative `EXPEDITION — 060` block and its unused CSS from tour detail. Internal tour IDs, routes, API requests and bookings are unchanged. TypeScript/lint, production build and diff whitespace checks passed; no new tests for this presentation-only removal.

## Sync latest FE main — 2026-10-31

Fetched `origin/main` and fast-forwarded `feature/tour-image-layout` from `2e7455d` to `1f509d0`. Saved all preceding tracked/untracked member 4 edits in a retained backup stash before applying them to the updated branch.

Resolved 8 conflicted files. Kept main's global Nunito setup, account/STAFF localization, tour content editor, catalog and validation/error-message updates. Retained the member 4 tour-detail redesign, compact Nunito timeline, centered gallery, removed decorative ID, new image picker and persisted image layout API. The API client also retains main's `englishApiMessage` integration. GUIDE deactivation copy still reflects its actual behavior without changing STAFF behavior. Other members' new order, payment, report and schedule code is included from main.

Verification: no unresolved files/conflict markers; diff whitespace check, TypeScript/lint and production build passed. All 46 discovered FE tests passed (12 tour/guide/image API, 21 schedule, 4 navigation, 9 report/chart). Desktop browser on actual tour 60 confirmed Nunito, matching cover/preview heights, no decorative expedition number, no Vite error overlay or horizontal overflow, and photo dialog opening. Existing bundle-size warning remains. No new commit/push and no backend changes in this sync.

## Sync FE main 1cd5abe — 2026-10-31

Fetched and fast-forwarded `feature/tour-image-layout` from `1f509d0` to `origin/main` `1cd5abe`. Included new equipment/home/storefront updates. No conflicts; a binary diff comparison before/after the merge confirmed all existing tracked member 4 working changes were preserved, and the three untracked feature files remain present. TypeScript/lint, all 46 discovered FE tests, production build and diff whitespace checks passed. Existing bundle-size warning remains. No FE commit/push or backend changes in this sync.
