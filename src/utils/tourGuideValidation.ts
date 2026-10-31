import { englishApiMessage } from './englishApiMessage';
import { EventGuideApiError, EventInput, EventResponse, GuideRegistrationInput, GuideUpdateInput } from "../services/eventGuideApi";

export type CatalogErrors = Record<string, string>;
const INTEGER_MAX = 2147483647;

// Dùng cùng giới hạn chuỗi như Bean Validation; chuỗi toàn khoảng trắng không hợp lệ khi bắt buộc.
function text(errors: CatalogErrors, path: string, value: string | null | undefined, label: string, max: number, required = false) {
  if (required && !value?.trim()) errors[path] = `${label} must not be empty or whitespace only.`;
  else if (value && value.length > max) errors[path] = `${label} must not exceed ${max.toLocaleString("en-GB")} characters.`;
}

// Kiểm tra đúng miền Integer mà BE nhận, tránh số thập phân, âm và giá trị không hữu hạn.
function integer(errors: CatalogErrors, path: string, value: number | null | undefined, label: string, min: number, required = true) {
  if (value == null && !required) return;
  if (!Number.isInteger(value) || value! < min || value! > INTEGER_MAX) {
    errors[path] = `${label} must be a whole number between ${min} and ${INTEGER_MAX.toLocaleString("en-GB")}.`;
  }
}

// Kiểm tra bản nháp và bản đang công bố; không thêm yêu cầu lịch trình vào điều kiện công bố của BE.
export function validateEvent(value: EventInput | EventResponse, published = false): CatalogErrors {
  const errors: CatalogErrors = {};
  text(errors, "eventName", value.eventName, "Tour name", 200, true);
  if (!["TREKKING", "CAMPING"].includes(value.eventType)) errors.eventType = "Please select trekking or camping.";
  text(errors, "description", value.description, "Description", 50000, published);
  text(errors, "location", value.location, "Province / city", 10000, published);
  if (!Number.isFinite(value.basePrice) || value.basePrice < 0 || !/^\d{1,16}(\.\d{1,2})?$/.test(String(value.basePrice))) {
    errors.basePrice = "Price must be non-negative, with up to 16 integer digits and 2 decimal places.";
  }
  const details = value.details;
  if (!details) {
    if (published) errors["details.durationMinutes"] = "Add tour details before publishing.";
    return errors;
  }
  integer(errors, "details.durationMinutes", details.durationMinutes, "Duration (minutes)", 1, published);
  if (details.difficultyLevel != null || published) {
    if (!["EASY", "MODERATE", "HARD"].includes(details.difficultyLevel!)) errors["details.difficultyLevel"] = "Please select a valid difficulty level.";
  }
  text(errors, "details.meetingPoint", details.meetingPoint, "Meeting point", 10000, published);
  text(errors, "details.requirements", details.requirements, "Participation requirements", 10000, published);
  const days = details.itinerary ?? [];
  if (days.length > 30) errors["details.itinerary"] = "The itinerary must not exceed 30 days.";
  days.forEach((day, index) => {
    const path = `details.itinerary[${index}]`;
    if (day.day !== index + 1) errors[`${path}.title`] = "Days must be consecutive, starting from day 1.";
    text(errors, `${path}.title`, day.title, "Day title", 200, true);
    text(errors, `${path}.summary`, day.summary, "Summary", 2000);
    text(errors, `${path}.distanceKm`, day.distanceKm, "Distance", 100);
    text(errors, `${path}.elevation`, day.elevation, "Elevation", 100);
    if (day.highlights.length > 20) errors[`${path}.highlights`] = "Add up to 20 highlights, one per line.";
    else if (day.highlights.some(item => !item.trim() || item.length > 300)) errors[`${path}.highlights`] = "Each highlight must contain text and be at most 300 characters. Remove empty lines.";
    if (day.activities.length > 50) errors[`${path}.activities`] = "Each day can have up to 50 activities.";
    day.activities.forEach((activity, activityIndex) => {
      const activityPath = `${path}.activities[${activityIndex}]`;
      text(errors, `${activityPath}.time`, activity.time, "Time", 100, true);
      text(errors, `${activityPath}.title`, activity.title, "Activity name", 200, true);
      text(errors, `${activityPath}.location`, activity.location, "Location", 1000);
      text(errors, `${activityPath}.description`, activity.description, "Activity description", 2000);
      if (activity.icon != null && !["meet", "hike", "food", "summit", "camp", "rest", "flag"].includes(activity.icon)) errors[`${activityPath}.icon`] = "Please select a valid activity type.";
    });
  });
  const packing = details.packingItems ?? [];
  if (packing.length > 100) errors["details.packingItems"] = "The packing list can contain up to 100 items.";
  packing.forEach((item, index) => {
    text(errors, `details.packingItems[${index}].text`, item.text, "Item name", 1000, true);
    if (typeof item.required !== "boolean") errors[`details.packingItems[${index}].required`] = "Specify whether the item is required.";
  });
  return errors;
}

// Hồ sơ guide dùng chung quy tắc cho tạo tài khoản mới và sửa hồ sơ hiện có.
export function validateGuide(value: GuideUpdateInput | GuideRegistrationInput): CatalogErrors {
  const errors: CatalogErrors = {};
  if ("email" in value) {
    text(errors, "fullName", value.fullName, "Full name", 150, true);
    text(errors, "email", value.email, "Email", 255, true);
    if (!errors.email && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value.email.trim())) errors.email = "Enter a valid email, such as guide@example.com.";
    text(errors, "phone", value.phone, "Phone number", 30);
  }
  integer(errors, "experienceYears", value.experienceYears, "Years of experience", 0);
  text(errors, "specialization", value.specialization, "Specialization", 1000, true);
  text(errors, "bio", value.bio, "Guide biography", 5000);
  const languages = value.languages ?? [];
  if (languages.length > 10) errors.languages = "Enter up to 10 languages, separated by commas.";
  else if (languages.some(language => !language.trim() || language.length > 50)) errors.languages = "Each language must contain text and be at most 50 characters.";
  return errors;
}

// Guide trên trang nhân sự còn sửa thông tin tài khoản; chặn lỗi trước cả hai request hiện có.
export function validateGuideAccountUpdate(value: GuideUpdateInput & { fullName: string; phone?: string }): CatalogErrors {
  const errors = validateGuide(value);
  text(errors, "fullName", value.fullName, "Full name", 150, true);
  text(errors, "phone", value.phone, "Phone number", 30);
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
  if (/must not be blank|must not be empty/i.test(message)) return "This field must not be empty or whitespace only.";
  if (/must not be null/i.test(message)) return "Please complete this field.";
  const max = message.match(/size must be between \d+ and (\d+)/i)?.[1];
  if (max) return `Value exceeds the maximum (${Number(max).toLocaleString("en-GB")}).`;
  if (/email/i.test(message)) return "Invalid email address.";
  if (/must be greater|must be less|numeric value out of bounds/i.test(message)) return "Value is outside the allowed range.";
  if (/must match/i.test(message)) return "Select a value from the allowed options.";
  return englishApiMessage(message || "Invalid value. Please check this field.");
}

// Trả thông báo có hành động rõ ràng cho lỗi quyền, mạng, xung đột và dịch vụ ảnh.
export function catalogErrorMessage(error: unknown): string {
  if (error instanceof EventGuideApiError || (error instanceof Error && "status" in error && typeof error.status === "number")) {
    const status = Number(error.status);
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to perform this action.";
    if (status === 404) return "This record is no longer available. Please refresh the list.";
    if (/email/i.test(error.message) && /exist|already|đã|trùng/i.test(error.message)) return "This email is already in use. Please use another email.";
    if (status === 413) return "The image exceeds 5 MiB. Please choose a smaller file.";
    if (status >= 500) return "The service is temporarily unavailable. Please try again later.";
    if (status === 409) return "The record already exists, has changed, or is not eligible for this action. Refresh and check the details.";
    return "Some details are invalid. Please check the form fields.";
  }
  return "Unable to connect to the server. Please try again; your input has been preserved.";
}

// Kiểm tra kích thước, MIME và chữ ký ảnh như BE; BE/Cloudinary vẫn kiểm tra nội dung đầy đủ.
export async function validateCatalogImage(file: File): Promise<string | undefined> {
  if (!file.size) return "The image file must not be empty.";
  if (file.size > 5 * 1024 * 1024) return "Images must not exceed 5 MiB.";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Only JPEG, PNG and WebP images are accepted.";
  try {
    const bytes = new Uint8Array(await file.slice(0, 24).arrayBuffer());
    const jpeg = bytes.length >= 12 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const png = bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v);
    const webp = bytes.length >= 20 && String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
    if (!(file.type === "image/jpeg" && jpeg || file.type === "image/png" && png || file.type === "image/webp" && webp)) return "The image content does not match its format. Please choose a valid image.";
  } catch {
    return "Unable to read the image. Please select the file again.";
  }
}
