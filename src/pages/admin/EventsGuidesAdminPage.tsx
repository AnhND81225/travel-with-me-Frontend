import { FormEvent, useEffect, useState } from "react";
import {
  eventGuideApi,
  AdminGuide,
  DifficultyLevel,
  EventImage,
  EventInput,
  EventStatus,
  EventSummary,
  GuideStatus,
} from "../../services/eventGuideApi";
import {
  Image as ImageIcon,
  Upload,
  Eye,
  Trash2,
  X,
  Plus,
  RefreshCw,
  ExternalLink,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Không thể thực hiện yêu cầu.";

const eventBlank: EventInput = {
  eventName: "",
  eventType: "TREKKING",
  basePrice: 0,
  description: "",
  location: "",
  details: {
    durationMinutes: 1440,
    difficultyLevel: "MODERATE",
    meetingPoint: "",
    requirements: "",
  },
};

const vnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

export function EventsGuidesAdminPage() {
  const [tab, setTab] = useState<"events" | "guides">("events");
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [guides, setGuides] = useState<AdminGuide[]>([]);
  const [event, setEvent] = useState<EventInput>(eventBlank);
  const [showDetailsForm, setShowDetailsForm] = useState(true);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // Form hướng dẫn viên
  const [guideUserId, setGuideUserId] = useState("");
  const [guideExperience, setGuideExperience] = useState("0");
  const [guideSpecialization, setGuideSpecialization] = useState("");

  // Modal quản lý ảnh
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");
  const [eventImages, setEventImages] = useState<EventImage[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageDescription, setImageDescription] = useState("");

  // Modal chỉnh sửa chuyến đi
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EventInput>(eventBlank);
  const [editLoading, setEditLoading] = useState(false);

  const load = async () => {
    setBusy(true);
    setNotice("");
    try {
      const [eventPage, guidePage] = await Promise.all([
        eventGuideApi.listAdminEvents({ size: 100 }),
        eventGuideApi.listAdminGuides({ size: 100 }),
      ]);
      setEvents(eventPage.items);
      setGuides(guidePage.items);
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createEvent = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await eventGuideApi.createEvent(event);
      setEvent(eventBlank);
      setNotice("Đã tạo chuyến đi ở trạng thái bản nháp. Vui lòng tải ảnh lên trước khi công bố.");
      await load();
    } catch (error) {
      setNotice(messageOf(error));
      setBusy(false);
    }
  };

  const createGuide = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await eventGuideApi.createGuide({
        userId: Number(guideUserId),
        experienceYears: Number(guideExperience),
        specialization: guideSpecialization,
      });
      setGuideUserId("");
      setGuideExperience("0");
      setGuideSpecialization("");
      setNotice("Đã tạo hồ sơ người dẫn đoàn thành công.");
      await load();
    } catch (error) {
      setNotice(messageOf(error));
      setBusy(false);
    }
  };

  const updateEventStatus = async (id: number, status: EventStatus) => {
    try {
      await eventGuideApi.setEventStatus(id, status);
      const statusLabel =
        status === "PUBLISHED" ? "Đã công bố" : status === "ARCHIVED" ? "Lưu trữ" : "Bản nháp";
      setNotice(`Đã chuyển trạng thái chuyến đi sang "${statusLabel}".`);
      await load();
    } catch (error) {
      setNotice(
        `${messageOf(error)} (Lưu ý: Để công bố chuyến đi, hệ thống yêu cầu có ít nhất 1 ảnh và điền đủ mô tả, địa điểm, điểm đón, yêu cầu tham gia, thời lượng và độ khó).`
      );
    }
  };

  const updateGuideStatus = async (id: number, status: GuideStatus) => {
    try {
      await eventGuideApi.setGuideStatus(id, status);
      setNotice("Đã cập nhật trạng thái hoạt động của hướng dẫn viên.");
      await load();
    } catch (error) {
      setNotice(messageOf(error));
    }
  };

  // Tải ảnh nhanh trực tiếp từ dòng trong bảng
  const upload = async (id: number, file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      await eventGuideApi.uploadEventImage(id, file);
      setNotice("Đã tải ảnh lên hệ thống thành công.");
      await load();
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  // Mở modal thư viện ảnh
  const openImageManager = async (item: EventSummary) => {
    setSelectedEventId(item.eventId);
    setSelectedEventTitle(item.eventName);
    setModalLoading(true);
    setImageDescription("");
    try {
      const full = await eventGuideApi.getAdminEvent(item.eventId);
      setEventImages(full.images || []);
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setModalLoading(false);
    }
  };

  const closeImageManager = () => {
    setSelectedEventId(null);
    setSelectedEventTitle("");
    setEventImages([]);
  };

  // Xóa ảnh trong modal
  const handleDeleteImage = async (imageId: number) => {
    if (!selectedEventId) return;
    if (!confirm("Bạn có chắc chắn muốn xóa bức ảnh này không?")) return;
    setBusy(true);
    try {
      await eventGuideApi.deleteEventImage(selectedEventId, imageId);
      setEventImages((prev) => prev.filter((img) => img.imageId !== imageId));
      setNotice("Đã xóa ảnh thành công.");
      await load();
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  // Tải ảnh lên từ trong modal
  const handleUploadInsideModal = async (file?: File) => {
    if (!file || !selectedEventId) return;
    setUploadingImage(true);
    try {
      const newImg = await eventGuideApi.uploadEventImage(
        selectedEventId,
        file,
        imageDescription || undefined
      );
      setEventImages((prev) => [...prev, newImg]);
      setImageDescription("");
      setNotice("Đã tải ảnh lên hệ thống thành công.");
      await load();
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setUploadingImage(false);
    }
  };

  // Mở modal chỉnh sửa chuyến đi
  const openEditModal = async (item: EventSummary) => {
    setEditingEventId(item.eventId);
    setEditLoading(true);
    try {
      const full = await eventGuideApi.getAdminEvent(item.eventId);
      setEditForm({
        eventName: full.eventName,
        eventType: full.eventType,
        basePrice: full.basePrice,
        location: full.location || "",
        description: full.description || "",
        details: {
          durationMinutes: full.details?.durationMinutes ?? 1440,
          difficultyLevel: full.details?.difficultyLevel ?? "MODERATE",
          meetingPoint: full.details?.meetingPoint ?? "",
          requirements: full.details?.requirements ?? "",
        },
      });
    } catch (error) {
      setNotice(messageOf(error));
      setEditingEventId(null);
    } finally {
      setEditLoading(false);
    }
  };

  // Lưu chỉnh sửa chuyến đi
  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingEventId) return;
    setBusy(true);
    try {
      await eventGuideApi.updateEvent(editingEventId, editForm);
      setNotice("Đã cập nhật thông tin chuyến đi thành công.");
      setEditingEventId(null);
      await load();
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto space-y-6">
      <header>
        <p className="text-xs tracking-widest font-bold text-[#7A857E]">
          QUẢN TRỊ / NỘI DUNG VÀ VẬN HÀNH
        </p>
        <h1 className="text-3xl font-bold">Chuyến đi & Hướng dẫn viên</h1>
        <p>Quản lý dữ liệu lịch trình và nhân sự thực địa; yêu cầu quyền Quản trị viên.</p>
      </header>

      {/* Khối hướng dẫn điều kiện công bố */}
      <div className="bg-[#152A20] text-[#E8F0EC] p-4 rounded-xs border border-[#2B4E3C] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#D97845] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <b className="text-white text-sm block mb-1">
            Quy tắc hiển thị chuyến đi ra trang khách hàng:
          </b>
          Trang khách hàng chỉ hiển thị những chuyến đi có trạng thái{" "}
          <span className="font-bold text-emerald-400 bg-emerald-950 px-1 py-0.5 rounded">
            Đã công bố
          </span>
          . Những chuyến đi mới tạo mặc định ở trạng thái{" "}
          <span className="font-bold text-amber-300 bg-amber-950 px-1 py-0.5 rounded">
            Bản nháp
          </span>
          . Để công bố chuyến đi, hệ thống yêu cầu bắt buộc:
          <span className="inline-block mt-1 font-medium text-emerald-200">
            ① Đã tải ít nhất 1 ảnh • ② Có mô tả chi tiết • ③ Có địa điểm tổ chức • ④ Có điểm đón đoàn •
            ⑤ Có yêu cầu tham gia • ⑥ Có thời lượng và độ khó rõ ràng.
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={
            tab === "events" ? "store-button" : "border border-[#c7cfc9] bg-white px-4 py-2"
          }
          onClick={() => setTab("events")}
        >
          Chuyến đi & Sự kiện
        </button>
        <button
          className={
            tab === "guides" ? "store-button" : "border border-[#c7cfc9] bg-white px-4 py-2"
          }
          onClick={() => setTab("guides")}
        >
          Hồ sơ người dẫn đoàn
        </button>
        <button
          className="border border-[#c7cfc9] bg-white px-4 py-2 flex items-center gap-1.5 hover:bg-gray-50 font-medium"
          onClick={() => void load()}
          disabled={busy}
        >
          <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
          Tải lại dữ liệu
        </button>
      </div>

      {notice && (
        <p role="status" className="customer-notice">
          {notice}
        </p>
      )}

      {tab === "events" ? (
        <>
          {/* Biểu mẫu tạo chuyến đi mới */}
          <form
            onSubmit={createEvent}
            className="grid gap-3 bg-white border border-[#d8d2c5] p-5 md:grid-cols-2"
          >
            <div className="md:col-span-2 flex items-center justify-between border-b pb-2">
              <h2 className="font-bold text-lg text-[#111D16]">Tạo chuyến đi mới</h2>
              <button
                type="button"
                onClick={() => setShowDetailsForm(!showDetailsForm)}
                className="text-xs text-[#D97845] hover:underline font-bold"
              >
                {showDetailsForm ? "- Thu gọn chi tiết" : "+ Mở rộng chi tiết hành trình"}
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Tên chuyến đi *</label>
              <input
                required
                className="w-full border border-[#c7cfc9] p-2 rounded-xs"
                placeholder="Ví dụ: Leo núi Tà Năng — Phan Dũng"
                value={event.eventName}
                onChange={(e) => setEvent({ ...event, eventName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Hình thức tổ chức *</label>
              <select
                className="w-full border border-[#c7cfc9] p-2 rounded-xs bg-white"
                value={event.eventType}
                onChange={(e) =>
                  setEvent({ ...event, eventType: e.target.value as EventInput["eventType"] })
                }
              >
                <option value="TREKKING">Leo núi dã ngoại</option>
                <option value="CAMPING">Cắm trại dã ngoại</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Giá cơ bản (đồng) *</label>
              <input
                className="w-full border border-[#c7cfc9] p-2 rounded-xs"
                type="number"
                min="0"
                required
                placeholder="Ví dụ: 1500000"
                value={event.basePrice}
                onChange={(e) => setEvent({ ...event, basePrice: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Địa điểm tổ chức *</label>
              <input
                required
                className="w-full border border-[#c7cfc9] p-2 rounded-xs"
                placeholder="Ví dụ: Lâm Đồng — Bình Thuận"
                value={event.location ?? ""}
                onChange={(e) => setEvent({ ...event, location: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700 block mb-1">Mô tả tổng quan *</label>
              <textarea
                required
                className="w-full border border-[#c7cfc9] p-2 rounded-xs"
                placeholder="Giới thiệu về cảnh quan, cung đường và trải nghiệm chuyến đi..."
                rows={2}
                value={event.description ?? ""}
                onChange={(e) => setEvent({ ...event, description: e.target.value })}
              />
            </div>

            {/* Mục chi tiết hành trình bắt buộc */}
            {showDetailsForm && (
              <div className="md:col-span-2 grid gap-3 bg-gray-50 border border-[#e5e0d8] p-4 rounded-xs sm:grid-cols-2">
                <p className="sm:col-span-2 text-xs font-bold text-[#111D16] uppercase tracking-wider">
                  Chi tiết hành trình (Bắt buộc để công bố)
                </p>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Độ khó cung đường</label>
                  <select
                    className="w-full border border-[#c7cfc9] p-2 bg-white rounded-xs text-sm"
                    value={event.details?.difficultyLevel || "MODERATE"}
                    onChange={(e) =>
                      setEvent({
                        ...event,
                        details: {
                          ...event.details,
                          difficultyLevel: e.target.value as DifficultyLevel,
                        },
                      })
                    }
                  >
                    <option value="EASY">Dễ (Người mới bắt đầu)</option>
                    <option value="MODERATE">Vừa sức (Đã có thể lực)</option>
                    <option value="HARD">Thử thách cao (Kinh nghiệm dày dặn)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Thời lượng dự kiến (tính bằng phút)
                  </label>
                  <input
                    type="number"
                    min="60"
                    className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm bg-white"
                    placeholder="Ví dụ: 2880 (2 ngày)"
                    value={event.details?.durationMinutes ?? 1440}
                    onChange={(e) =>
                      setEvent({
                        ...event,
                        details: {
                          ...event.details,
                          durationMinutes: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Điểm đón & tập trung đoàn
                  </label>
                  <input
                    className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm bg-white"
                    placeholder="Ví dụ: Trạm điều phối thực địa TerraPeak"
                    value={event.details?.meetingPoint ?? ""}
                    onChange={(e) =>
                      setEvent({
                        ...event,
                        details: {
                          ...event.details,
                          meetingPoint: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Yêu cầu tham gia (Thể lực & trang bị)
                  </label>
                  <input
                    className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm bg-white"
                    placeholder="Ví dụ: Thể lực tốt, giày leo núi chuyên dụng..."
                    value={event.details?.requirements ?? ""}
                    onChange={(e) =>
                      setEvent({
                        ...event,
                        details: {
                          ...event.details,
                          requirements: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}

            <button className="store-button md:col-span-2" disabled={busy}>
              {busy ? "Đang xử lý..." : "Tạo chuyến đi"}
            </button>
          </form>

          {/* Bảng danh sách chuyến đi */}
          <div className="overflow-x-auto bg-white border border-[#d8d2c5]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-[#d8d2c5] text-xs uppercase text-gray-600">
                  <th className="p-3 w-16">Ảnh bìa</th>
                  <th className="p-3">Chuyến đi</th>
                  <th className="p-3">Loại hình</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {events.map((item) => (
                  <tr className="border-t border-[#e5e0d8] hover:bg-gray-50/60" key={item.eventId}>
                    {/* Cột ảnh thu nhỏ */}
                    <td className="p-3">
                      {item.coverImageUrl ? (
                        <button
                          type="button"
                          onClick={() => void openImageManager(item)}
                          className="relative group shrink-0 w-14 h-14 rounded-xs overflow-hidden border border-[#d8d2c5] bg-gray-100 hover:opacity-90 block"
                          title="Bấm để xem tất cả ảnh"
                        >
                          <img
                            src={item.coverImageUrl}
                            alt={item.eventName}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute inset-0 bg-black/40 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            Xem
                          </span>
                        </button>
                      ) : (
                        <div
                          className="w-14 h-14 rounded-xs border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-[10px] text-gray-400 shrink-0"
                          title="Chưa có ảnh bìa"
                        >
                          <ImageIcon className="w-4 h-4 mb-0.5 opacity-50" />
                          <span>Chưa ảnh</span>
                        </div>
                      )}
                    </td>

                    {/* Tên & Địa điểm */}
                    <td className="p-3">
                      <b className="text-base text-[#111D16]">{item.eventName}</b>
                      <div className="text-xs text-gray-500">
                        {item.location || "Chưa cập nhật địa điểm"}
                      </div>
                      <div className="text-xs font-semibold text-[#D97845] mt-0.5">
                        {vnd(item.basePrice)}
                      </div>
                    </td>

                    {/* Loại hình */}
                    <td className="p-3 text-sm">
                      <span className="font-medium">
                        {item.eventType === "TREKKING" ? "Leo núi" : "Cắm trại"}
                      </span>
                      <div className="text-xs text-gray-500">
                        {item.difficultyLevel === "EASY"
                          ? "Dễ"
                          : item.difficultyLevel === "HARD"
                          ? "Thử thách cao"
                          : "Vừa sức"}
                      </div>
                    </td>

                    {/* Chọn trạng thái */}
                    <td className="p-3">
                      <select
                        className={`border p-1.5 text-sm rounded-xs font-bold ${
                          item.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : item.status === "ARCHIVED"
                            ? "bg-gray-100 text-gray-600 border-gray-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                        value={item.status}
                        onChange={(e) =>
                          void updateEventStatus(item.eventId, e.target.value as EventStatus)
                        }
                      >
                        <option value="DRAFT">Bản nháp</option>
                        <option value="PUBLISHED">Đã công bố</option>
                        <option value="ARCHIVED">Lưu trữ</option>
                      </select>
                      {item.status === "DRAFT" && !item.coverImageUrl && (
                        <div className="text-[11px] text-amber-700 flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          Cần tải ảnh để công bố
                        </div>
                      )}
                      {item.status === "PUBLISHED" && (
                        <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Đang hiển thị trên trang chủ
                        </div>
                      )}
                    </td>

                    {/* Cột thao tác */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void openEditModal(item)}
                          className="border border-[#c7cfc9] bg-white hover:bg-gray-100 text-xs py-1.5 px-2.5 rounded-xs flex items-center gap-1 font-medium"
                          title="Chỉnh sửa thông tin chi tiết"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-gray-600" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void openImageManager(item)}
                          className="border border-[#c7cfc9] bg-white hover:bg-gray-100 text-xs py-1.5 px-2.5 rounded-xs flex items-center gap-1 font-medium"
                          title="Quản lý thư viện ảnh"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                          <span>Xem ảnh</span>
                        </button>
                        <label className="store-button text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1 font-medium">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Tải ảnh</span>
                          <input
                            className="hidden"
                            type="file"
                            accept="image/*"
                            disabled={busy}
                            onChange={(e) => void upload(item.eventId, e.target.files?.[0])}
                          />
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
                {!events.length && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      Chưa có chuyến đi nào được tạo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Form tạo hồ sơ người dẫn đoàn */}
          <form
            onSubmit={createGuide}
            className="grid gap-3 bg-white border border-[#d8d2c5] p-5 md:grid-cols-3"
          >
            <h2 className="md:col-span-3 font-bold text-lg">Tạo hồ sơ người dẫn đoàn</h2>
            <input
              required
              className="border border-[#c7cfc9] p-2 rounded-xs"
              type="number"
              min="1"
              placeholder="Mã tài khoản người dùng (User ID) *"
              value={guideUserId}
              onChange={(e) => setGuideUserId(e.target.value)}
            />
            <input
              required
              className="border border-[#c7cfc9] p-2 rounded-xs"
              type="number"
              min="0"
              placeholder="Số năm kinh nghiệm thực địa *"
              value={guideExperience}
              onChange={(e) => setGuideExperience(e.target.value)}
            />
            <input
              required
              className="border border-[#c7cfc9] p-2 rounded-xs"
              placeholder="Chuyên môn dẫn đoàn *"
              value={guideSpecialization}
              onChange={(e) => setGuideSpecialization(e.target.value)}
            />
            <button className="store-button md:col-span-3" disabled={busy}>
              Tạo hồ sơ
            </button>
          </form>

          {/* Bảng danh sách người dẫn đoàn */}
          <div className="overflow-x-auto bg-white border border-[#d8d2c5]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-[#d8d2c5] text-xs uppercase text-gray-600">
                  <th className="p-3">Người dẫn đoàn</th>
                  <th className="p-3">Chuyên môn thực địa</th>
                  <th className="p-3">Trạng thái hoạt động</th>
                </tr>
              </thead>
              <tbody>
                {guides.map((guide) => (
                  <tr className="border-t border-[#e5e0d8] hover:bg-gray-50/60" key={guide.guideId}>
                    <td className="p-3">
                      <b className="text-base text-[#111D16]">{guide.displayName}</b>
                      <br />
                      <small className="text-gray-500">
                        Tài khoản #{guide.userId} · {guide.experienceYears ?? 0} năm kinh nghiệm
                      </small>
                    </td>
                    <td className="p-3 text-sm">{guide.specialization}</td>
                    <td className="p-3">
                      <select
                        className="border border-[#c7cfc9] p-1.5 text-sm rounded-xs bg-white font-medium"
                        value={guide.status}
                        onChange={(e) =>
                          void updateGuideStatus(guide.guideId, e.target.value as GuideStatus)
                        }
                      >
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="INACTIVE">Tạm dừng hoạt động</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {!guides.length && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-gray-500">
                      Chưa có hồ sơ người dẫn đoàn nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Chỉnh sửa chuyến đi */}
      {editingEventId !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-xs max-w-2xl w-full border border-[#d8d2c5] shadow-xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 border-b border-[#d8d2c5] bg-[#F3EFE6]">
              <h3 className="font-bold text-lg text-[#111D16]">
                Chỉnh sửa chuyến đi (Mã số: #{editingEventId})
              </h3>
              <button
                type="button"
                onClick={() => setEditingEventId(null)}
                className="p-1 hover:bg-gray-200 rounded text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editLoading ? (
              <div className="p-10 text-center text-gray-500">Đang tải thông tin chuyến đi...</div>
            ) : (
              <form onSubmit={handleSaveEdit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Tên chuyến đi *</label>
                    <input
                      required
                      className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                      value={editForm.eventName}
                      onChange={(e) => setEditForm({ ...editForm, eventName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Hình thức tổ chức</label>
                    <select
                      className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm bg-white"
                      value={editForm.eventType}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          eventType: e.target.value as EventInput["eventType"],
                        })
                      }
                    >
                      <option value="TREKKING">Leo núi dã ngoại</option>
                      <option value="CAMPING">Cắm trại dã ngoại</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Giá cơ bản (đồng)</label>
                    <input
                      type="number"
                      required
                      className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                      value={editForm.basePrice}
                      onChange={(e) =>
                        setEditForm({ ...editForm, basePrice: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Địa điểm tổ chức *</label>
                    <input
                      required
                      className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                      value={editForm.location ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Mô tả chi tiết *</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                    value={editForm.description ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>

                <div className="border-t pt-3 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#111D16]">
                    Chi tiết hành trình (Bắt buộc để công bố)
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Độ khó</label>
                      <select
                        className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm bg-white"
                        value={editForm.details?.difficultyLevel || "MODERATE"}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            details: {
                              ...editForm.details,
                              difficultyLevel: e.target.value as DifficultyLevel,
                            },
                          })
                        }
                      >
                        <option value="EASY">Dễ (Người mới bắt đầu)</option>
                        <option value="MODERATE">Vừa sức (Đã có thể lực)</option>
                        <option value="HARD">Thử thách cao (Kinh nghiệm dày dặn)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Thời lượng dự kiến (phút)
                      </label>
                      <input
                        type="number"
                        min="60"
                        className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                        value={editForm.details?.durationMinutes ?? 1440}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            details: {
                              ...editForm.details,
                              durationMinutes: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Điểm đón & tập trung đoàn *
                      </label>
                      <input
                        required
                        className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                        placeholder="Ví dụ: Trạm điều phối thực địa"
                        value={editForm.details?.meetingPoint ?? ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            details: {
                              ...editForm.details,
                              meetingPoint: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Yêu cầu tham gia *
                      </label>
                      <input
                        required
                        className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                        placeholder="Ví dụ: Thể lực tốt, giày leo núi chuyên dụng"
                        value={editForm.details?.requirements ?? ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            details: {
                              ...editForm.details,
                              requirements: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingEventId(null)}
                    className="border border-[#c7cfc9] bg-white px-4 py-2 text-sm rounded-xs hover:bg-gray-100"
                  >
                    Hủy bỏ
                  </button>
                  <button className="store-button text-sm py-2 px-5" disabled={busy}>
                    {busy ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Quản lý ảnh */}
      {selectedEventId !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-xs max-w-3xl w-full border border-[#d8d2c5] shadow-xl overflow-hidden my-8">
            {/* Tiêu đề modal */}
            <div className="flex items-center justify-between p-4 border-b border-[#d8d2c5] bg-[#F3EFE6]">
              <div>
                <h3 className="font-bold text-lg text-[#111D16]">Quản lý thư viện ảnh</h3>
                <p className="text-xs text-gray-600">{selectedEventTitle} (Mã số: #{selectedEventId})</p>
              </div>
              <button
                type="button"
                onClick={closeImageManager}
                className="p-1 hover:bg-gray-200 rounded text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nội dung modal */}
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Mục tải ảnh mới */}
              <div className="border border-dashed border-[#c7cfc9] bg-gray-50 p-4 rounded-xs space-y-3">
                <h4 className="font-bold text-sm text-[#111D16] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#D97845]" />
                  Tải thêm ảnh mới lên hệ thống lưu trữ
                </h4>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    type="text"
                    className="border border-[#c7cfc9] bg-white p-2 text-sm rounded-xs"
                    placeholder="Mô tả ảnh (tùy chọn, vd: Bãi trại hoàng hôn)"
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                  />
                  <label
                    className={`store-button text-sm py-2 px-4 cursor-pointer flex items-center justify-center gap-2 ${
                      uploadingImage ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingImage ? "Đang tải lên..." : "Chọn ảnh tải lên"}</span>
                    <input
                      className="hidden"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingImage}
                      onChange={(e) => void handleUploadInsideModal(e.target.files?.[0])}
                    />
                  </label>
                </div>
                <small className="text-[11px] text-gray-500 block">
                  Hỗ trợ định dạng JPG, PNG, WebP với dung lượng tối đa 5MB. Bức ảnh đầu tiên sẽ được
                  dùng làm ảnh bìa.
                </small>
              </div>

              {/* Danh sách ảnh hiện có */}
              {modalLoading ? (
                <div className="py-12 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                  Đang tải danh sách ảnh...
                </div>
              ) : eventImages.length > 0 ? (
                <div>
                  <h4 className="font-bold text-sm text-[#111D16] mb-3">
                    Ảnh hiện có ({eventImages.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {eventImages.map((img, index) => (
                      <div
                        key={img.imageId}
                        className="group relative border border-[#d8d2c5] rounded-xs overflow-hidden bg-gray-100 flex flex-col"
                      >
                        <div className="relative aspect-4/3 overflow-hidden bg-black/5">
                          <img
                            src={img.imageUrl}
                            alt={img.description || `Ảnh ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute top-1.5 left-1.5 bg-[#111D16] text-[#F3EFE6] text-[10px] font-bold px-1.5 py-0.5 rounded-xs tracking-wider">
                              ẢNH BÌA
                            </span>
                          )}
                          <a
                            href={img.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-1.5 left-1.5 bg-black/60 text-white p-1 rounded-xs opacity-0 group-hover:opacity-100 transition"
                            title="Mở ảnh gốc trong thẻ mới"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="p-2 flex items-center justify-between text-xs bg-white">
                          <span
                            className="truncate text-gray-600 max-w-[140px]"
                            title={img.description || `Mã ảnh: #${img.imageId}`}
                          >
                            {img.description || `Ảnh #${img.imageId}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleDeleteImage(img.imageId)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-gray-400 border border-dashed border-[#d8d2c5] rounded-xs">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">Chuyến đi này chưa có bức ảnh nào.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Vui lòng tải lên ít nhất 1 ảnh để có thể công bố chuyến đi.
                  </p>
                </div>
              )}
            </div>

            {/* Chân modal */}
            <div className="p-3 border-t border-[#d8d2c5] bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={closeImageManager}
                className="border border-[#c7cfc9] bg-white px-4 py-2 text-sm rounded-xs hover:bg-gray-100 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
