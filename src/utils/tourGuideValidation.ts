import { EventGuideApiError, EventInput, EventResponse, GuideRegistrationInput, GuideUpdateInput } from "../services/eventGuideApi";

export type CatalogErrors = Record<string, string>;
const INTEGER_MAX = 2147483647;

// Dùng cùng giới hạn chuỗi như Bean Validation; chuỗi toàn khoảng trắng không hợp lệ khi bắt buộc.
function text(errors: CatalogErrors, path: string, value: string | null | undefined, label: string, max: number, required = false) {
  if (required && !value?.trim()) errors[path] = `${label} không được để trống hoặc chỉ có khoảng trắng.`;
  else if (value && value.length > max) errors[path] = `${label} tối đa ${max.toLocaleString("vi-VN")} ký tự.`;
}

// Kiểm tra đúng miền Integer mà BE nhận, tránh số thập phân, âm và giá trị không hữu hạn.
function integer(errors: CatalogErrors, path: string, value: number | null | undefined, label: string, min: number, required = true) {
  if (value == null && !required) return;
  if (!Number.isInteger(value) || value! < min || value! > INTEGER_MAX) {
    errors[path] = `${label} phải là số nguyên từ ${min} đến ${INTEGER_MAX.toLocaleString("vi-VN")}.`;
  }
}

// Kiểm tra bản nháp và bản đang công bố; không thêm yêu cầu lịch trình vào điều kiện công bố của BE.
export function validateEvent(value: EventInput | EventResponse, published = false): CatalogErrors {
  const errors: CatalogErrors = {};
  text(errors, "eventName", value.eventName, "Tên tour", 200, true);
  if (!["TREKKING", "CAMPING"].includes(value.eventType)) errors.eventType = "Vui lòng chọn trekking hoặc camping.";
  text(errors, "description", value.description, "Giới thiệu", 50000, published);
  text(errors, "location", value.location, "Tỉnh/thành phố", 10000, published);
  if (!Number.isFinite(value.basePrice) || value.basePrice < 0 || !/^\d{1,16}(\.\d{1,2})?$/.test(String(value.basePrice))) {
    errors.basePrice = "Giá phải từ 0 trở lên, tối đa 16 chữ số phần nguyên và 2 chữ số thập phân.";
  }
  const details = value.details;
  if (!details) {
    if (published) errors["details.durationMinutes"] = "Cần bổ sung chi tiết trước khi công bố.";
    return errors;
  }
  integer(errors, "details.durationMinutes", details.durationMinutes, "Thời lượng (phút)", 1, published);
  if (details.difficultyLevel != null || published) {
    if (!["EASY", "MODERATE", "HARD"].includes(details.difficultyLevel!)) errors["details.difficultyLevel"] = "Vui lòng chọn độ khó hợp lệ.";
  }
  text(errors, "details.meetingPoint", details.meetingPoint, "Điểm tập trung", 10000, published);
  text(errors, "details.requirements", details.requirements, "Yêu cầu tham gia", 10000, published);
  const days = details.itinerary ?? [];
  if (days.length > 30) errors["details.itinerary"] = "Lịch trình tối đa 30 ngày.";
  days.forEach((day, index) => {
    const path = `details.itinerary[${index}]`;
    if (day.day !== index + 1) errors[`${path}.title`] = "Các ngày phải liên tục từ ngày 1.";
    text(errors, `${path}.title`, day.title, "Tên chặng", 200, true);
    text(errors, `${path}.summary`, day.summary, "Tóm tắt", 2000);
    text(errors, `${path}.distanceKm`, day.distanceKm, "Cự ly", 100);
    text(errors, `${path}.elevation`, day.elevation, "Độ cao", 100);
    if (day.highlights.length > 20) errors[`${path}.highlights`] = "Tối đa 20 điểm nổi bật, mỗi dòng một ý.";
    else if (day.highlights.some(item => !item.trim() || item.length > 300)) errors[`${path}.highlights`] = "Mỗi điểm nổi bật cần có nội dung và tối đa 300 ký tự; hãy xóa dòng trống.";
    if (day.activities.length > 50) errors[`${path}.activities`] = "Mỗi ngày tối đa 50 hoạt động.";
    day.activities.forEach((activity, activityIndex) => {
      const activityPath = `${path}.activities[${activityIndex}]`;
      text(errors, `${activityPath}.time`, activity.time, "Thời gian", 100, true);
      text(errors, `${activityPath}.title`, activity.title, "Tên hoạt động", 200, true);
      text(errors, `${activityPath}.location`, activity.location, "Địa điểm", 1000);
      text(errors, `${activityPath}.description`, activity.description, "Mô tả hoạt động", 2000);
      if (activity.icon != null && !["meet", "hike", "food", "summit", "camp", "rest", "flag"].includes(activity.icon)) errors[`${activityPath}.icon`] = "Vui lòng chọn loại hoạt động hợp lệ.";
    });
  });
  const packing = details.packingItems ?? [];
  if (packing.length > 100) errors["details.packingItems"] = "Danh mục tối đa 100 trang bị.";
  packing.forEach((item, index) => {
    text(errors, `details.packingItems[${index}].text`, item.text, "Tên trang bị", 1000, true);
    if (typeof item.required !== "boolean") errors[`details.packingItems[${index}].required`] = "Vui lòng xác định trang bị có bắt buộc hay không.";
  });
  return errors;
}

// Hồ sơ guide dùng chung quy tắc cho tạo tài khoản mới và sửa hồ sơ hiện có.
export function validateGuide(value: GuideUpdateInput | GuideRegistrationInput): CatalogErrors {
  const errors: CatalogErrors = {};
  if ("email" in value) {
    text(errors, "fullName", value.fullName, "Họ tên", 150, true);
    text(errors, "email", value.email, "Email", 255, true);
    if (!errors.email && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value.email.trim())) errors.email = "Email không hợp lệ, ví dụ: guide@example.com.";
    text(errors, "phone", value.phone, "Số điện thoại", 30);
  }
  integer(errors, "experienceYears", value.experienceYears, "Số năm kinh nghiệm", 0);
  text(errors, "specialization", value.specialization, "Chuyên môn", 1000, true);
  text(errors, "bio", value.bio, "Giới thiệu guide", 5000);
  const languages = value.languages ?? [];
  if (languages.length > 10) errors.languages = "Tối đa 10 ngôn ngữ, phân cách bằng dấu phẩy.";
  else if (languages.some(language => !language.trim() || language.length > 50)) errors.languages = "Mỗi ngôn ngữ cần có nội dung và tối đa 50 ký tự.";
  return errors;
}

// Guide trên trang nhân sự còn sửa thông tin tài khoản; chặn lỗi trước cả hai request hiện có.
export function validateGuideAccountUpdate(value: GuideUpdateInput & { fullName: string; phone?: string }): CatalogErrors {
  const errors = validateGuide(value);
  text(errors, "fullName", value.fullName, "Họ tên", 150, true);
  text(errors, "phone", value.phone, "Số điện thoại", 30);
  return errors;
}

// Giữ giá trị trống là NaN để validation không nhầm ô giá/kinh nghiệm trống thành số 0.
export function inputNumber(value: string): number {
  return value.trim() ? Number(value) : NaN;
}

// Gom lỗi phần tử danh sách của BE về đúng textarea ngôn ngữ/điểm nổi bật trên FE.
export function catalogErrorPath(path: string): string {
  return path.replace(/(\.highlights|^languages)\[\d+\].*$/, "$1");
}

// Dịch thông báo Bean Validation phổ biến; giữ lỗi nghiệp vụ tiếng Việt từ BE.
export function catalogFieldMessage(message: string): string {
  if (/must not be blank|must not be empty/i.test(message)) return "Không được để trống hoặc chỉ có khoảng trắng.";
  if (/must not be null/i.test(message)) return "Vui lòng nhập thông tin này.";
  const max = message.match(/size must be between \d+ and (\d+)/i)?.[1];
  if (max) return `Vượt giới hạn cho phép (tối đa ${Number(max).toLocaleString("vi-VN")}).`;
  if (/email/i.test(message)) return "Email không hợp lệ.";
  if (/must be greater|must be less|numeric value out of bounds/i.test(message)) return "Giá trị nằm ngoài giới hạn cho phép.";
  if (/must match/i.test(message)) return "Giá trị không thuộc danh sách cho phép.";
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(message)
    ? message : "Giá trị chưa hợp lệ. Vui lòng kiểm tra lại thông tin.";
}

// Trả thông báo có hành động rõ ràng cho lỗi quyền, mạng, xung đột và dịch vụ ảnh.
export function catalogErrorMessage(error: unknown): string {
  if (error instanceof EventGuideApiError || (error instanceof Error && "status" in error && typeof error.status === "number")) {
    const status = Number(error.status);
    if (status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
    if (status === 404) return "Dữ liệu không còn tồn tại. Vui lòng tải lại danh sách.";
    if (/email/i.test(error.message) && /exist|already|đã|trùng/i.test(error.message)) return "Email này đã được sử dụng. Vui lòng chọn email khác.";
    if (status === 413) return "Ảnh vượt quá 5 MiB. Vui lòng chọn ảnh nhỏ hơn.";
    if (status >= 500) return "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.";
    if (status === 409) return "Dữ liệu bị trùng, trạng thái đã thay đổi hoặc thao tác chưa đủ điều kiện. Vui lòng tải lại và kiểm tra thông tin.";
    return "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường nhập.";
  }
  return "Không thể kết nối máy chủ. Vui lòng thử lại; dữ liệu bạn nhập vẫn được giữ.";
}

// Kiểm tra kích thước, MIME và chữ ký ảnh như BE; BE/Cloudinary vẫn kiểm tra nội dung đầy đủ.
export async function validateCatalogImage(file: File): Promise<string | undefined> {
  if (!file.size) return "Ảnh không được rỗng.";
  if (file.size > 5 * 1024 * 1024) return "Ảnh tối đa 5 MiB.";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.";
  try {
    const bytes = new Uint8Array(await file.slice(0, 24).arrayBuffer());
    const jpeg = bytes.length >= 12 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const png = bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v);
    const webp = bytes.length >= 20 && String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
    if (!(file.type === "image/jpeg" && jpeg || file.type === "image/png" && png || file.type === "image/webp" && webp)) return "Nội dung ảnh không khớp định dạng. Vui lòng chọn ảnh hợp lệ.";
  } catch {
    return "Không thể đọc ảnh. Vui lòng chọn lại tệp.";
  }
}
