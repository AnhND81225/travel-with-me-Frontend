import { englishApiMessage } from './englishApiMessage';
import assert from "node:assert/strict";
import { test } from "node:test";
import { EventGuideApiError, EventInput, GuideRegistrationInput, ItineraryDay } from "../services/eventGuideApi";
import { catalogErrorMessage, catalogErrorPath, catalogFieldMessage, inputNumber, validateCatalogImage, validateEvent, validateGuide, validateGuideAccountUpdate } from "./tourGuideValidation";

// Mỗi bài nhận dữ liệu mới để không làm ảnh hưởng bài khác khi sửa trường lồng nhau.
function event(): EventInput {
  return { eventName: "Tour mẫu", eventType: "TREKKING", basePrice: 1500000, description: "Hai ngày ngoài trời", location: "Lâm Đồng", details: {
    durationMinutes: 2880, difficultyLevel: "MODERATE", meetingPoint: "Đà Lạt", requirements: "Giày trekking", itinerary: [{
      day: 1, title: "Đi bộ", highlights: ["Đồi cỏ"], activities: [{ time: "07:00 – 08:00", title: "Tập trung", icon: "meet" }],
    }], packingItems: [{ text: "Giày", required: true }],
  } };
}

// Hồ sơ đăng ký mới tương ứng contract của BE, không gọi API tạo tài khoản/gửi mail.
function guide(): GuideRegistrationInput {
  return { fullName: "Nguyễn Văn An", email: "guide@example.com", experienceYears: 0, specialization: "Trekking", languages: ["Tiếng Việt"] };
}

test("tour hợp lệ; bản nháp được thiếu nội dung công bố; bản công bố phải đủ nội dung", () => {
  assert.deepEqual(validateEvent(event(), true), {});
  const draft: EventInput = { eventName: "Nháp", eventType: "CAMPING", basePrice: 0 };
  assert.deepEqual(validateEvent(draft), {});
  assert.deepEqual(Object.keys(validateEvent(draft, true)).sort(), ["description", "location", "details.durationMinutes"].sort());
  const value = event();
  value.description = " "; value.location = " "; value.details!.meetingPoint = " "; value.details!.requirements = " ";
  assert.equal(Object.keys(validateEvent(value, true)).length, 4);
});

test("chặn giá sai, ô trống, thời lượng phân số/âm/vượt Integer; cho phép giá 0 và 2 số lẻ", () => {
  assert.ok(Number.isNaN(inputNumber("")));
  assert.ok(Number.isNaN(inputNumber("   ")));
  assert.equal(inputNumber("0"), 0);
  for (const price of [-1, NaN, Infinity, 1.001, 1e16]) assert.ok(validateEvent({ ...event(), basePrice: price }).basePrice);
  for (const price of [0, 0.29, 1500000.99]) assert.equal(validateEvent({ ...event(), basePrice: price }).basePrice, undefined);
  for (const duration of [0, -1, 1.5, Infinity, 2147483648]) {
    const value = event(); value.details!.durationMinutes = duration;
    assert.ok(validateEvent(value)["details.durationMinutes"]);
  }
  const value = event(); value.details!.durationMinutes = 1;
  assert.deepEqual(validateEvent(value), {});
});

test("tạo và sửa dùng chung giới hạn tour cơ bản, không chấp nhận tên toàn khoảng trắng", () => {
  const value = event(); value.eventName = "   ";
  assert.ok(validateEvent(value).eventName);
  value.eventName = "a".repeat(201); value.description = "a".repeat(50001); value.location = "a".repeat(10001);
  value.details!.meetingPoint = "a".repeat(10001); value.details!.requirements = "a".repeat(10001);
  assert.equal(Object.keys(validateEvent(value)).length, 5);
});

test("chặn số ngày, hoạt động, highlights và trang bị ở đúng đường dẫn input", () => {
  const value = event(); const day = value.details!.itinerary![0];
  day.highlights = Array(21).fill("ý");
  assert.ok(validateEvent(value)["details.itinerary[0].highlights"]);
  for (const highlights of [[" "], ["a".repeat(301)]]) {
    day.highlights = highlights;
    assert.ok(validateEvent(value)["details.itinerary[0].highlights"]);
  }
  day.highlights = Array(20).fill("a".repeat(300));
  assert.equal(validateEvent(value)["details.itinerary[0].highlights"], undefined);
  day.activities = Array.from({ length: 51 }, () => ({ time: "07:00", title: "Đi bộ", icon: "hike" }));
  assert.ok(validateEvent(value)["details.itinerary[0].activities"]);
  day.activities = [{ time: " ", title: " ", icon: "meet" }];
  assert.ok(validateEvent(value)["details.itinerary[0].activities[0].time"]);
  assert.ok(validateEvent(value)["details.itinerary[0].activities[0].title"]);
  day.day = 2;
  assert.ok(validateEvent(value)["details.itinerary[0].title"]);
  value.details!.itinerary = Array.from({ length: 31 }, (_, i) => ({ ...day, day: i + 1, activities: [] } as ItineraryDay));
  assert.ok(validateEvent(value)["details.itinerary"]);
  value.details!.packingItems = Array.from({ length: 101 }, () => ({ text: "Đồ", required: true }));
  assert.ok(validateEvent(value)["details.packingItems"]);
  value.details!.packingItems[0].text = " ";
  assert.ok(validateEvent(value)["details.packingItems[0].text"]);
});

test("guide: họ tên/email/chuyên môn, năm nguyên không âm và danh sách ngôn ngữ", () => {
  assert.deepEqual(validateGuide(guide()), {});
  const value = guide(); value.fullName = " "; value.email = "sai@"; value.specialization = " "; value.experienceYears = NaN;
  assert.deepEqual(Object.keys(validateGuide(value)).sort(), ["fullName", "email", "specialization", "experienceYears"].sort());
  for (const experienceYears of [-1, 0.5, 2147483648]) assert.ok(validateGuide({ ...guide(), experienceYears }).experienceYears);
  assert.ok(validateGuide({ ...guide(), bio: "a".repeat(5001) }).bio);
  assert.ok(validateGuide({ ...guide(), languages: Array(11).fill("vi") }).languages);
  assert.ok(validateGuide({ ...guide(), languages: ["a".repeat(51)] }).languages);
  assert.ok(validateGuide({ ...guide(), phone: "1".repeat(31) }).phone);
  assert.deepEqual(validateGuide({ experienceYears: 2, specialization: "Camping", languages: [] }), {});
});

test("lỗi BE được ánh xạ về input và English messages, không mất lỗi xác thực", () => {
  assert.equal(catalogErrorPath("details.itinerary[0].highlights[1].<list element>"), "details.itinerary[0].highlights");
  assert.equal(catalogErrorPath("languages[1].<list element>"), "languages");
  assert.match(catalogFieldMessage("size must be between 0 and 300"), /300/);
  assert.match(catalogFieldMessage("must not be blank"), /empty/);
  assert.match(catalogErrorMessage(new EventGuideApiError("expired", 401)), /sign in/);
  assert.match(catalogErrorMessage(new EventGuideApiError("forbidden", 403)), /permission/);
  assert.match(catalogErrorMessage(new EventGuideApiError("Email already exists", 400)), /email.*in use/);
  assert.match(catalogErrorMessage(Object.assign(new Error("Forbidden"), { status: 403 })), /permission/);
  assert.match(catalogErrorMessage(new TypeError("Failed to fetch")), /preserved/);
});

test("upload ảnh: từ chối file rỗng, lớn, sai MIME/chữ ký và nhận PNG hợp lệ", async () => {
  assert.match((await validateCatalogImage(new File([], "empty.png", { type: "image/png" })))!, /empty/);
  assert.match((await validateCatalogImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" })))!, /5 MiB/);
  assert.match((await validateCatalogImage(new File(["text"], "text.txt", { type: "text/plain" })))!, /JPEG/);
  assert.match((await validateCatalogImage(new File(["not-a-png"], "fake.png", { type: "image/png" })))!, /does not match/);
  const png = new Uint8Array(24); png.set([137,80,78,71,13,10,26,10]);
  assert.equal(await validateCatalogImage(new File([png], "image.png", { type: "image/png" })), undefined);
});


test("sửa guide trên trang nhân sự kiểm tra tài khoản trước khi gửi hai API", () => {
  assert.ok(validateGuideAccountUpdate({ experienceYears: 1, specialization: "Trekking", fullName: " " }).fullName);
  assert.ok(validateGuideAccountUpdate({ experienceYears: 1, specialization: "Trekking", fullName: "An", phone: "0".repeat(31) }).phone);
  assert.deepEqual(validateGuideAccountUpdate({ experienceYears: 0, specialization: "Trekking", fullName: "An" }), {});
});

test("API messages use English and preserve actionable payment and access guidance", () => {
  assert.equal(englishApiMessage("Hết chỗ", 409), "This departure is fully booked. Please choose another departure.");
  assert.match(englishApiMessage("Vé có giao dịch cũ", 409), /existing payment/);
  assert.match(englishApiMessage("Không có quyền", 403), /permission/);
  assert.equal(englishApiMessage("Please refresh the page.", 409), "Please refresh the page.");
  assert.match(englishApiMessage("Dữ liệu không hợp lệ", 400), /Check the entered details/);
});

test("guide assignment conflicts show specific scheduling and account guidance", () => {
  assert.match(englishApiMessage("Guide đã có lịch trùng", 409), /already assigned.*different guide/);
  assert.match(englishApiMessage("Guide hoặc tài khoản không hoạt động", 409), /inactive/);
});
