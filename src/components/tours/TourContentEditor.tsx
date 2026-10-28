import { EventDetailsInput, ItineraryDay, TourActivity } from "../../services/eventGuideApi";

import { CatalogField } from "./CatalogForm";

type Props = {
  value: EventDetailsInput;
  onChange: (value: EventDetailsInput) => void;
};

const inputClass = "w-full border border-[#c7cfc9] bg-white p-2 rounded-xs text-sm";
const buttonClass = "border border-[#c7cfc9] bg-white px-3 py-1.5 text-xs rounded-xs hover:bg-gray-100";

// Nhập nội dung chi tiết dùng chung cho cả form tạo và sửa tour.
export function TourContentEditor({ value, onChange }: Props) {
  const days = value.itinerary ?? [];
  const packingItems = value.packingItems ?? [];

  // Thay một ngày, giữ nguyên nội dung những ngày còn lại.
  function updateDay(index: number, patch: Partial<ItineraryDay>) {
    onChange({ ...value, itinerary: days.map((day, i) => i === index ? { ...day, ...patch } : day) });
  }

  // Chỉ thay hoạt động được chọn trong ngày hiện tại.
  function updateActivity(dayIndex: number, activityIndex: number, patch: Partial<TourActivity>) {
    updateDay(dayIndex, {
      activities: days[dayIndex].activities.map((activity, i) => i === activityIndex ? { ...activity, ...patch } : activity),
    });
  }

  return (
    <div className="space-y-5">
      <section className="space-y-3" aria-label="Lịch trình từng ngày">
        <div className="flex justify-between items-center gap-2">
          <h3 className="font-bold text-sm">Lịch trình từng ngày ({days.length}/30)</h3>
          <button data-catalog-list-edit type="button" className={buttonClass} disabled={days.length >= 30}
            onClick={() => onChange({ ...value, itinerary: [...days, {
              day: days.length + 1, title: "", summary: "", distanceKm: "", elevation: "", highlights: [], activities: [],
            }] })}>Thêm ngày</button>
        </div>
        {days.length === 0 && <p className="text-xs text-gray-500">Chưa có lịch trình. Thêm ngày để nhập nội dung hiển thị cho khách.</p>}
        {days.map((day, dayIndex) => (
          <fieldset key={dayIndex} className="border border-[#d8d2c5] rounded p-3 space-y-3">
            <legend className="px-1 text-sm font-bold">Ngày {day.day}</legend>
            <div className="flex justify-end">
              <button data-catalog-list-edit type="button" className={buttonClass} onClick={() => onChange({ ...value,
                itinerary: days.filter((_, i) => i !== dayIndex).map((item, i) => ({ ...item, day: i + 1 })),
              })}>Xóa ngày {day.day}</button>
            </div>
            <label className="block text-xs space-y-1">Tên chặng *
              <CatalogField name={`details.itinerary[${dayIndex}].title`} label="Tên chặng"><input className={inputClass} required maxLength={200} value={day.title}
                onChange={e => updateDay(dayIndex, { title: e.target.value })} /></CatalogField>
            </label>
            <label className="block text-xs space-y-1">Tóm tắt trong ngày
              <CatalogField name={`details.itinerary[${dayIndex}].summary`} label="Tóm tắt trong ngày"><textarea className={inputClass} maxLength={2000} value={day.summary ?? ""}
                onChange={e => updateDay(dayIndex, { summary: e.target.value })} /></CatalogField>
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-xs space-y-1">Cự ly (ví dụ: 8–10 km)
                <CatalogField name={`details.itinerary[${dayIndex}].distanceKm`} label="Cự ly"><input className={inputClass} maxLength={100} value={day.distanceKm ?? ""}
                  onChange={e => updateDay(dayIndex, { distanceKm: e.target.value })} /></CatalogField>
              </label>
              <label className="block text-xs space-y-1">Độ cao (ví dụ: lên 500 m)
                <CatalogField name={`details.itinerary[${dayIndex}].elevation`} label="Độ cao"><input className={inputClass} maxLength={100} value={day.elevation ?? ""}
                  onChange={e => updateDay(dayIndex, { elevation: e.target.value })} /></CatalogField>
              </label>
            </div>
            <label className="block text-xs space-y-1">Điểm nổi bật (mỗi dòng một ý, tối đa 20 ý, mỗi ý 300 ký tự)
              <CatalogField name={`details.itinerary[${dayIndex}].highlights`} label="Điểm nổi bật"><textarea className={inputClass} rows={3} value={day.highlights.join("\n")}
                onChange={e => updateDay(dayIndex, { highlights: e.target.value.split("\n") })}
 /></CatalogField>
              <span className="block text-xs text-gray-500">{day.highlights.length === 1 && !day.highlights[0] ? 0 : day.highlights.length}/20 ý. Mỗi ý tối đa 300 ký tự.</span>
            </label>
            <div className="space-y-3">
              <div className="flex justify-between items-center gap-2">
                <h4 className="text-xs font-bold">Hoạt động ({day.activities.length}/50)</h4>
                <button data-catalog-list-edit type="button" className={buttonClass} disabled={day.activities.length >= 50}
                  onClick={() => updateDay(dayIndex, { activities: [...day.activities, {
                    time: "", title: "", location: "", description: "", icon: "hike",
                  }] })}>Thêm hoạt động</button>
              </div>
              {day.activities.map((activity, activityIndex) => (
                <fieldset key={activityIndex} className="bg-[#f7f3ea] p-3 rounded space-y-2 border border-[#e6e2d9]">
                  <legend className="text-xs font-semibold">Hoạt động {activityIndex + 1}</legend>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <label className="text-xs space-y-1">Thời gian *
                      <CatalogField name={`details.itinerary[${dayIndex}].activities[${activityIndex}].time`} label="Thời gian hoạt động"><input className={inputClass} required maxLength={100} placeholder="07:00 – 08:30"
                        value={activity.time} onChange={e => updateActivity(dayIndex, activityIndex, { time: e.target.value })} /></CatalogField>
                    </label>
                    <label className="text-xs space-y-1">Tên hoạt động *
                      <CatalogField name={`details.itinerary[${dayIndex}].activities[${activityIndex}].title`} label="Tên hoạt động"><input className={inputClass} required maxLength={200} value={activity.title}
                        onChange={e => updateActivity(dayIndex, activityIndex, { title: e.target.value })} /></CatalogField>
                    </label>
                    <label className="text-xs space-y-1">Địa điểm
                      <CatalogField name={`details.itinerary[${dayIndex}].activities[${activityIndex}].location`} label="Địa điểm hoạt động"><input className={inputClass} maxLength={1000} value={activity.location ?? ""}
                        onChange={e => updateActivity(dayIndex, activityIndex, { location: e.target.value })} /></CatalogField>
                    </label>
                    <label className="text-xs space-y-1">Loại hoạt động
                      <CatalogField name={`details.itinerary[${dayIndex}].activities[${activityIndex}].icon`} label="Loại hoạt động"><select aria-label="Loại hoạt động" className={inputClass} value={activity.icon}
                        onChange={e => updateActivity(dayIndex, activityIndex, { icon: e.target.value as TourActivity["icon"] })}>
                        <option value="meet">Tập trung</option><option value="hike">Đi bộ</option>
                        <option value="food">Ăn uống</option><option value="summit">Chinh phục đỉnh</option>
                        <option value="camp">Cắm trại</option><option value="rest">Nghỉ ngơi</option>
                        <option value="flag">Kết thúc</option>
                      </select></CatalogField>
                    </label>
                  </div>
                  <label className="block text-xs space-y-1">Mô tả hoạt động
                    <CatalogField name={`details.itinerary[${dayIndex}].activities[${activityIndex}].description`} label="Mô tả hoạt động"><textarea className={inputClass} maxLength={2000} value={activity.description ?? ""}
                      onChange={e => updateActivity(dayIndex, activityIndex, { description: e.target.value })} /></CatalogField>
                  </label>
                  <button data-catalog-list-edit type="button" className={buttonClass} onClick={() => updateDay(dayIndex, {
                    activities: day.activities.filter((_, i) => i !== activityIndex),
                  })}>Xóa hoạt động {activityIndex + 1}</button>
                </fieldset>
              ))}
            </div>
          </fieldset>
        ))}
      </section>

      <section className="space-y-3" aria-label="Danh mục đồ cần mang">
        <div className="flex justify-between items-center gap-2">
          <h3 className="font-bold text-sm">Đồ cần mang ({packingItems.length}/100)</h3>
          <button data-catalog-list-edit type="button" className={buttonClass} disabled={packingItems.length >= 100}
            onClick={() => onChange({ ...value, packingItems: [...packingItems, { text: "", required: false }] })}>Thêm trang bị</button>
        </div>
        {packingItems.length === 0 && <p className="text-xs text-gray-500">Chưa có danh mục trang bị.</p>}
        {packingItems.map((item, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <label className="flex-1 min-w-40 text-xs space-y-1">Trang bị {index + 1} *
              <CatalogField name={`details.packingItems[${index}].text`} label="Tên trang bị"><input className={inputClass} required maxLength={1000} value={item.text}
                onChange={e => onChange({ ...value, packingItems: packingItems.map((p, i) => i === index ? { ...p, text: e.target.value } : p) })} /></CatalogField>
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={item.required}
                onChange={e => onChange({ ...value, packingItems: packingItems.map((p, i) => i === index ? { ...p, required: e.target.checked } : p) })} />Bắt buộc
            </label>
            <button data-catalog-list-edit type="button" className={buttonClass} aria-label={`Xóa trang bị ${index + 1}`}
              onClick={() => onChange({ ...value, packingItems: packingItems.filter((_, i) => i !== index) })}>Xóa</button>
          </div>
        ))}
      </section>
    </div>
  );
}
