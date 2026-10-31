import { FormEvent, useEffect, useRef, useState } from "react";
import {
  eventGuideApi,
  AdminGuide,
  DifficultyLevel,
  EventImage,
  EventInput,
  EventStatus,
  EventSummary,
  GuideStatus,
  GuideUpdateInput,
  GuideRegistrationResponse,
  GuideRegistrationInput,
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
} from "lucide-react";

import { TourImagePicker } from "../../components/tours/TourImagePicker";

import { TourContentEditor } from "../../components/tours/TourContentEditor";

import { CatalogField, CatalogForm } from "../../components/tours/CatalogForm";
import { catalogErrorMessage, inputNumber, validateCatalogImage, validateEvent, validateGuide } from "../../utils/tourGuideValidation";

const messageOf = catalogErrorMessage;

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
    itinerary: [],
    packingItems: [],
  },
};

const TOUR_LOCATIONS = [
  "Hà Nội",
  "Huế",
  "Hải Phòng",
  "Đà Nẵng",
  "Cần Thơ",
  "Thành phố Hồ Chí Minh",
  "Lai Châu",
  "Điện Biên",
  "Sơn La",
  "Lạng Sơn",
  "Cao Bằng",
  "Tuyên Quang",
  "Lào Cai",
  "Thái Nguyên",
  "Phú Thọ",
  "Bắc Ninh",
  "Hưng Yên",
  "Ninh Bình",
  "Quảng Ninh",
  "Thanh Hóa",
  "Nghệ An",
  "Hà Tĩnh",
  "Quảng Trị",
  "Quảng Ngãi",
  "Gia Lai",
  "Khánh Hòa",
  "Lâm Đồng",
  "Đắk Lắk",
  "Đồng Nai",
  "Tây Ninh",
  "Đồng Tháp",
  "Vĩnh Long",
  "An Giang",
  "Cà Mau",
];

const vnd = (amount: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const parseLanguages = (value: string) =>
  value
    .split(",")
    .map((language) => language.trim())
    .filter(Boolean);

export function EventsGuidesAdminPage() {
  const [tab, setTab] = useState<"events" | "guides">("events");
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [guides, setGuides] = useState<AdminGuide[]>([]);
  const [event, setEvent] = useState<EventInput>(eventBlank);
  const [showDetailsForm, setShowDetailsForm] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createPhotoDays, setCreatePhotoDays] = useState<Map<File, number | null>>(new Map());
  const [createdPlacements, setCreatedPlacements] = useState<{ imageId: number; dayNumber: number | null }[]>([]);
  const [createPhotos, setCreatePhotos] = useState<File[]>([]);
  const [createdDraftId, setCreatedDraftId] = useState<number | null>(null);
  const [uploadedPhotoCount, setUploadedPhotoCount] = useState(0);
  const [checkingCreatePhotos, setCheckingCreatePhotos] = useState(false);
  const [createPhotoError, setCreatePhotoError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // Form hướng dẫn viên
  const [guideFullName, setGuideFullName] = useState("");
  const [guideEmail, setGuideEmail] = useState("");
  const [guidePhone, setGuidePhone] = useState("");
  const [guideCredentials, setGuideCredentials] = useState<GuideRegistrationResponse | null>(null);
  const [guideExperience, setGuideExperience] = useState("0");
  const [guideSpecialization, setGuideSpecialization] = useState("");
  const [guideBio, setGuideBio] = useState("");
  const [guideLanguages, setGuideLanguages] = useState("");
  const [guideEditLanguages, setGuideEditLanguages] = useState("");
  const [editingGuide, setEditingGuide] = useState<AdminGuide | null>(null);
  const [guideEditForm, setGuideEditForm] = useState<GuideUpdateInput>({
    experienceYears: 0,
    specialization: "",
    bio: "",
    languages: [],
  });

  // Modal quản lý ảnh
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");
  const imageRequest = useRef(0);
  const [imageDays, setImageDays] = useState<number[]>([]);
  const [imageLayoutDirty, setImageLayoutDirty] = useState(false);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [eventImages, setEventImages] = useState<EventImage[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageDescription, setImageDescription] = useState("");
  const [imageError, setImageError] = useState("");

  // Modal chỉnh sửa chuyến đi
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EventInput>(eventBlank);
  const [editLoading, setEditLoading] = useState(false);

  const guideInput: GuideRegistrationInput = {
    fullName: guideFullName.trim(), email: guideEmail.trim(), phone: guidePhone.trim() || undefined,
    experienceYears: inputNumber(guideExperience), specialization: guideSpecialization,
    bio: guideBio || undefined, languages: parseLanguages(guideLanguages),
  };
  const guideEditInput: GuideUpdateInput = { ...guideEditForm, languages: parseLanguages(guideEditLanguages) };
  const imageReadOnly = events.find(item => item.eventId === selectedEventId)?.status === "ARCHIVED";
  const editingPublished = events.find(item => item.eventId === editingEventId)?.status === "PUBLISHED";

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

  // Lưu nháp một lần rồi upload tuần tự để giữ đúng ảnh bìa/thứ tự theo ID.
  // Nếu upload lỗi, giữ draft ID và tệp còn lại để tiếp tục mà không tạo tour trùng.
  const createEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (checkingCreatePhotos) return;
    setBusy(true);
    setCreatePhotoError("");
    let draftId = createdDraftId;
    try {
      if (draftId) await eventGuideApi.updateEvent(draftId, event);
      else {
        const created = await eventGuideApi.createEvent(event);
        draftId = created.eventId;
        setCreatedDraftId(draftId);
      }
      const placements = [...createdPlacements];
      for (const file of createPhotos) {
        const uploaded = await eventGuideApi.uploadEventImage(draftId, file);
        const dayNumber = createPhotoDays.get(file) ?? null;
        placements.push({ imageId: uploaded.imageId, dayNumber });
        setCreatedPlacements([...placements]);
        setCreatePhotos(previous => previous.slice(1));
        setUploadedPhotoCount(count => count + 1);
      }
      const days = new Set((event.details?.itinerary ?? []).map(day => day.day));
      await eventGuideApi.saveEventImageLayout(draftId, placements.map(image => ({ ...image, dayNumber: image.dayNumber && days.has(image.dayNumber) ? image.dayNumber : null })));
      setEvent(eventBlank);
      setCreatedPlacements([]);
      setCreatePhotoDays(new Map());
      setCreatedDraftId(null);
      setUploadedPhotoCount(0);
      setCreateModalOpen(false);
      await load();
      setNotice("Draft and photos saved. Review the content before publishing.");
    } catch (error) {
      if (draftId) setCreatePhotoError(`Draft #${draftId} is saved. ${messageOf(error)} Submit again to continue with the remaining photos; no new tour will be created.`);
      else throw error;
    } finally {
      setBusy(false);
    }
  };

  // Tạo đồng thời tài khoản và hồ sơ; chỉ giữ mật khẩu tạm trong state để ADMIN bàn giao.
  const createGuide = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await eventGuideApi.createGuideWithAccount(guideInput);
      setGuideCredentials(created);
      setGuideFullName("");
      setGuideEmail("");
      setGuidePhone("");
      setGuideExperience("0");
      setGuideSpecialization("");
      setGuideBio("");
      setGuideLanguages("");
      await load();
      setNotice("Guide account and profile created. You can now upload an avatar from the guide list.");
    } catch (error) {
      setBusy(false);
      throw error;
    }
  };

  const updateEventStatus = async (id: number, status: EventStatus) => {
    try {
      if (status === "PUBLISHED") {
        const full = await eventGuideApi.getAdminEvent(id);
        const errors = validateEvent(full, true);
        if (!full.images.length) errors.images = "Add at least one image before publishing.";
        if (Object.keys(errors).length) {
          setNotice(`Cannot publish yet: ${Object.values(errors).join(" ")}`);
          return;
        }
      }
      await eventGuideApi.setEventStatus(id, status);
      const statusLabel =
        status === "PUBLISHED" ? "Published" : status === "ARCHIVED" ? "Archived" : "Draft";
      setNotice(`Trip status changed to "${statusLabel}".`);
      await load();
    } catch (error) {
      setNotice(
        messageOf(error)
      );
    }
  };

  const updateGuideStatus = async (id: number, status: GuideStatus) => {
    try {
      await eventGuideApi.setGuideStatus(id, status);
      setNotice("Guide availability status updated.");
      await load();
    } catch (error) {
      setNotice(messageOf(error));
    }
  };

  const saveGuide = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingGuide) return;
    setBusy(true);
    try {
      await eventGuideApi.updateGuide(editingGuide.guideId, guideEditInput);
      setEditingGuide(null);
      await load();
      setNotice("Guide profile updated.");
    } catch (error) {
      throw error;
    } finally {
      setBusy(false);
    }
  };

  const openGuideEditor = (guide: AdminGuide) => {
    setEditingGuide(guide);
    setGuideEditLanguages((guide.languages ?? []).join(", "));
    setGuideEditForm({
      experienceYears: guide.experienceYears ?? 0,
      specialization: guide.specialization || "",
      bio: guide.bio || "",
      languages: guide.languages || [],
    });
  };

  const uploadGuideAvatar = async (guideId: number, file?: File) => {
    if (!file) return;
    const imageValidation = await validateCatalogImage(file);
    if (imageValidation) { setNotice(imageValidation);  return; }
    setBusy(true);
    try {
      await eventGuideApi.uploadGuideAvatar(guideId, file);
      setNotice("Guide avatar uploaded successfully.");
      await load();
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  const deleteGuideAvatar = async (guideId: number) => {
    if (!confirm("Remove this guide avatar?")) return;
    setBusy(true);
    try {
      await eventGuideApi.deleteGuideAvatar(guideId);
      setNotice("Guide avatar removed.");
      await load();
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  // Tải ảnh nhanh trực tiếp từ dòng trong bảng
  const upload = async (id: number, file?: File) => {
    if (!file) return;
    const imageValidation = await validateCatalogImage(file);
    if (imageValidation) { setNotice(imageValidation);  return; }
    setBusy(true);
    try {
      await eventGuideApi.uploadEventImage(id, file);
      setNotice("Image uploaded successfully.");
      await load();
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  // Mở modal thư viện ảnh
  // Bỏ qua response thư viện cũ khi đã đóng hoặc chuyển sang tour khác.
  const openImageManager = async (item: EventSummary) => {
    const request = ++imageRequest.current;
    setSelectedEventId(item.eventId);
    setSelectedEventTitle(item.eventName);
    setModalLoading(true);
    setEventImages([]);
    setImageDays([]);
    setImageLayoutDirty(false);
    setImageDescription("");
    setImageError("");
    try {
      const full = await eventGuideApi.getAdminEvent(item.eventId);
      if (request !== imageRequest.current) return;
      setEventImages(full.images || []);
      setImageDays((full.details?.itinerary ?? []).map(day => day.day));
    } catch (error) {
      if (request === imageRequest.current) setImageError(messageOf(error));
    } finally {
      if (request === imageRequest.current) setModalLoading(false);
    }
  };

  const closeImageManager = () => {
    if (layoutSaving || uploadingImage || busy) return;
    imageRequest.current++;
    setSelectedEventId(null);
    setSelectedEventTitle("");
    setEventImages([]);
  };

  // Đổi thứ tự trong bản xem trước; chỉ lưu qua endpoint bố cục khi người dùng chọn Save.
  const moveImage = (index: number, target: number) => {
    const next = [...eventImages];
    const [image] = next.splice(index, 1);
    next.splice(target, 0, image);
    setEventImages(next);
    setImageLayoutDirty(true);
  };

  // Gửi toàn bộ thư viện để BE kiểm ảnh thuộc tour, thứ tự và ngày trong cùng transaction.
  const saveImageLayout = async () => {
    if (!selectedEventId || layoutSaving || imageReadOnly) return;
    setLayoutSaving(true);
    setImageError("");
    try {
      setEventImages(await eventGuideApi.saveEventImageLayout(selectedEventId, eventImages.map(image => ({ imageId: image.imageId, dayNumber: image.dayNumber ?? null }))));
      setImageLayoutDirty(false);
      await load();
      setNotice("Cover, gallery order and itinerary photos saved.");
    } catch (error) { setImageError(messageOf(error)); }
    finally { setLayoutSaving(false); }
  };

  // Xóa ảnh trong modal
  const handleDeleteImage = async (imageId: number) => {
    if (!selectedEventId || imageLayoutDirty || layoutSaving || uploadingImage || imageReadOnly) return;
    if (!confirm("Are you sure you want to delete this image?")) return;
    setBusy(true);
    try {
      await eventGuideApi.deleteEventImage(selectedEventId, imageId);
      setEventImages((prev) => prev.filter((img) => img.imageId !== imageId));
      setNotice("Image deleted successfully.");
      await load();
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  // Tải ảnh lên từ trong modal
  const handleUploadInsideModal = async (file?: File) => {
    if (!file || !selectedEventId || imageLayoutDirty || layoutSaving || uploadingImage || busy || imageReadOnly) return;
    const imageValidation = await validateCatalogImage(file);
    if (imageValidation) { setNotice(imageValidation); setImageError(imageValidation); return; }
    if (imageDescription.length > 1000) { setImageError("Image descriptions must not exceed 1,000 characters."); return; }
    setImageError("");
    setUploadingImage(true);
    try {
      const newImg = await eventGuideApi.uploadEventImage(
        selectedEventId,
        file,
        imageDescription || undefined
      );
      setEventImages((prev) => [...prev, newImg]);
      setImageDescription("");
      setNotice("Image uploaded successfully.");
      await load();
    } catch (error) {
      setImageError(messageOf(error));
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
          itinerary: full.details?.itinerary ?? [],
          packingItems: full.details?.packingItems ?? [],
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
      setEditingEventId(null);
      await load();
      setNotice("Tour content updated.");
    } catch (error) {
      throw error;
    } finally {
      setBusy(false);
    }
  };

  const publishedCount = events.filter((item) => item.status === "PUBLISHED").length;
  const draftCount = events.filter((item) => item.status === "DRAFT").length;
  const archivedCount = events.filter((item) => item.status === "ARCHIVED").length;

  return (
    <section className="max-w-7xl mx-auto space-y-6 font-label">
      <header className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest font-bold text-[#7A857E]">ADMIN / CONTENT & OPERATIONS</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">Tours & Events</h1>
          <p className="text-xs text-[#5C665F]">Manage trip content, publication status, and image libraries.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#D97845] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#bd5d2e]" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" /> New trip
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-[#D8D2C5] bg-[#F8F6F1] text-[#152A20] font-bold text-xs uppercase tracking-wider hover:bg-[#EBE6DC] disabled:opacity-60"
            onClick={() => void load()}
            disabled={busy}
          >
            <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
            Reload
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Total tours", events.length, "text-[#152A20]"],
          ["Draft", draftCount, "text-[#D97845]"],
          ["Published", publishedCount, "text-emerald-800"],
          ["Archived", archivedCount, "text-[#5C665F]"],
        ].map(([label, count, tone]) => (
          <div key={String(label)} className="p-4 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] shadow-xs">
            <div className="text-[10px] font-bold text-[#5C665F] uppercase tracking-wider">{label}</div>
            <div className={`text-2xl font-bold mt-1 font-headline ${tone}`}>{count}</div>
          </div>
        ))}
      </div>

      {notice && (
        <p role="status" className="customer-notice">
          {notice}
        </p>
      )}

      {tab === "events" ? (
        <>
          {createModalOpen && (
            <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
              <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F8F6F1] border border-[#D8D2C5] shadow-xl">
          <CatalogForm onSubmit={createEvent} validate={() => validateEvent(event)} onInvalid={() => setShowDetailsForm(true)} className="grid gap-3 p-5 md:grid-cols-2">
            <div className="md:col-span-2 flex items-center justify-between border-b border-[#D8D2C5] pb-3">
              <div>
                <p className="text-[10px] font-bold text-[#7A857E] uppercase tracking-wider">Trip catalogue</p>
                <h2 className="font-bold text-lg text-[#111D16]">{createdDraftId ? `Continue draft #${createdDraftId}` : "Create a new trip"}</h2>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setShowDetailsForm(!showDetailsForm)} className="text-xs text-[#D97845] hover:underline font-bold">{showDetailsForm ? "- Hide details" : "+ Show trip details"}</button>
                <button type="button" disabled={busy} onClick={() => setCreateModalOpen(false)} className="p-1 text-[#5C665F] hover:bg-[#EBE6DC]" aria-label="Close"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Trip name *</label>
              <CatalogField name="eventName" label="Tour name"><input maxLength={200}
                required
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] p-2 text-sm rounded-xs focus:outline-none focus:border-[#152A20]"
                placeholder="Example: Ta Nang — Phan Dung Trek"
                value={event.eventName}
                onChange={(e) => setEvent({ ...event, eventName: e.target.value })}
              /></CatalogField>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Experience type *</label>
              <CatalogField name="eventType" label="Experience type"><select
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] p-2 text-sm rounded-xs focus:outline-none focus:border-[#152A20]"
                value={event.eventType}
                onChange={(e) =>
                  setEvent({ ...event, eventType: e.target.value as EventInput["eventType"] })
                }
              >
                <option value="TREKKING">Trekking</option>
                <option value="CAMPING">Camping</option>
              </select></CatalogField>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Base price (VND) *</label>
              <CatalogField name="basePrice" label="Base price"><input step="0.01"
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] p-2 text-sm rounded-xs focus:outline-none focus:border-[#152A20]"
                type="number"
                min="0"
                required
                placeholder="Example: 1500000"
                value={Number.isNaN(event.basePrice) ? "" : event.basePrice}
                onChange={(e) => setEvent({ ...event, basePrice: inputNumber(e.target.value) })}
              /></CatalogField>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Province/city (required to publish)</label>
              <CatalogField name="location" label="Province/city"><select

                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] p-2 text-sm rounded-xs focus:outline-none focus:border-[#152A20]"
                value={event.location ?? ""}
                onChange={(e) => setEvent({ ...event, location: e.target.value })}
              >
                <option value="">Select a province/city</option>
                {TOUR_LOCATIONS.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select></CatalogField>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700 block mb-1">Introduction (required to publish)</label>
              <CatalogField name="description" label="Tour introduction"><textarea maxLength={50000}

                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] p-2 text-sm rounded-xs focus:outline-none focus:border-[#152A20]"
                placeholder="Describe scenery, route, and trip experience..."
                rows={2}
                value={event.description ?? ""}
                onChange={(e) => setEvent({ ...event, description: e.target.value })}
              /></CatalogField>
            </div>

            {/* Mục chi tiết hành trình bắt buộc */}
            {showDetailsForm && (
              <div className="md:col-span-2 grid gap-3 bg-white border border-[#D8D2C5] p-4 rounded-xs sm:grid-cols-2">
                <p className="sm:col-span-2 text-xs font-bold text-[#111D16] uppercase tracking-wider">
                  Trip details (required to publish)
                </p>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Trail difficulty</label>
                  <CatalogField name="details.difficultyLevel" label="Difficulty"><select
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
                    <option value="EASY">Easy (beginners)</option>
                    <option value="MODERATE">Moderate (basic fitness)</option>
                    <option value="HARD">Challenging (experienced hikers)</option>
                  </select></CatalogField>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Estimated duration (minutes)
                  </label>
                  <CatalogField name="details.durationMinutes" label="Duration (minutes)"><input max={2147483647} step="1"
                    type="number"
                    min="1"
                    className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm bg-white"
                    placeholder="Example: 2880 (2 days)"
                    value={event.details?.durationMinutes ?? ""}
                    onChange={(e) =>
                      setEvent({
                        ...event,
                        details: {
                          ...event.details,
                          durationMinutes: e.target.value === "" ? undefined : inputNumber(e.target.value),
                        },
                      })
                    }
                  /></CatalogField>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Pickup & meeting point
                  </label>
                  <CatalogField name="details.meetingPoint" label="Meeting point"><input maxLength={10000}
                    className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm bg-white"
                    placeholder="Example: TerraPeak field operations station"
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
                  /></CatalogField>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Participation requirements (fitness & equipment)
                  </label>
                  <CatalogField name="details.requirements" label="Participation requirements"><input maxLength={10000}
                    className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm bg-white"
                    placeholder="Example: Good fitness, suitable hiking shoes..."
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
                  /></CatalogField>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <TourImagePicker files={createPhotos} onChange={setCreatePhotos} disabled={busy} onCheckingChange={setCheckingCreatePhotos} uploadedCount={uploadedPhotoCount} days={(event.details?.itinerary ?? []).map(day => day.day)} dayNumbers={createPhotoDays} onDayChange={(file, day) => setCreatePhotoDays(previous => new Map(previous).set(file, day))} />
              {createPhotoError && <p role="alert" className="my-3 text-sm text-red-700">{createPhotoError}</p>}
              <TourContentEditor value={event.details ?? {}} onChange={details => setEvent({ ...event, details })} />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-[#D8D2C5]">
              <button type="button" disabled={busy} onClick={() => setCreateModalOpen(false)} className="px-4 py-2.5 border border-[#D8D2C5] bg-white text-xs font-bold uppercase tracking-wider hover:bg-[#EBE6DC]">Cancel</button>
            <button className="bg-[#152A20] text-[#F3EFE6] px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#264334] disabled:opacity-60" disabled={busy || checkingCreatePhotos}>
              {busy ? "Saving trip and photos..." : createdDraftId ? "Continue saving draft" : "Create trip"}
            </button>
            </div>
          </CatalogForm>
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {events.map((item) => (
              <article key={item.eventId} className="grid grid-cols-[132px_1fr] overflow-hidden border border-[#D8D2C5] bg-[#F8F6F1] shadow-xs min-h-44">
                <button type="button" onClick={() => void openImageManager(item)} className="relative bg-[#EBE6DC] group text-left">
                  {item.coverImageUrl ? <img src={item.coverImageUrl} alt={item.eventName} className="h-full w-full object-cover" /> : <span className="h-full min-h-44 flex flex-col items-center justify-center gap-1 text-[10px] text-[#7A857E]"><ImageIcon className="w-5 h-5" />No image</span>}
                  <span className="absolute left-2 top-2 px-2 py-1 text-[10px] font-bold bg-white/90 text-[#152A20]">{item.status}</span>
                </button>
                <div className="p-4 flex flex-col min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-headline font-bold text-base text-[#111D16] truncate">{item.eventName}</h2>
                      <p className="mt-1 text-xs text-[#5C665F] truncate">{item.location || "Location not set"}</p>
                    </div>
                    <strong className="shrink-0 text-sm text-[#152A20]">{vnd(item.basePrice)}</strong>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5C665F]">
                    <span>{item.eventType === "TREKKING" ? "Trekking" : "Camping"}</span>
                    <span>{item.difficultyLevel === "EASY" ? "Easy" : item.difficultyLevel === "HARD" ? "Challenging" : "Moderate"}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <select className={`border p-1.5 text-xs rounded-xs font-bold ${item.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : item.status === "ARCHIVED" ? "bg-gray-100 text-gray-600 border-gray-300" : "bg-amber-50 text-amber-800 border-amber-300"}`} value={item.status} onChange={(e) => void updateEventStatus(item.eventId, e.target.value as EventStatus)}>
                      <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option>
                    </select>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => void openEditModal(item)} className="border border-[#D8D2C5] bg-white px-2 py-1.5 text-xs hover:bg-[#EBE6DC]" title="Edit trip details"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => void openImageManager(item)} className="border border-[#D8D2C5] bg-white px-2 py-1.5 text-xs hover:bg-[#EBE6DC]" title="Manage image library"><Eye className="w-3.5 h-3.5" /></button>
                      <label className="bg-[#152A20] text-[#F3EFE6] px-2 py-1.5 text-xs cursor-pointer hover:bg-[#264334]" title="Upload image"><Upload className="w-3.5 h-3.5" /><input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; void upload(item.eventId, file); }} /></label>
                    </div>
                  </div>
                  {item.status === "DRAFT" && !item.coverImageUrl ? <p className="mt-2 text-[10px] text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Upload an image before publishing</p> : null}
                  {item.status === "PUBLISHED" ? <p className="mt-2 text-[10px] text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Visible on the customer site</p> : null}
                </div>
              </article>
            ))}
            {!events.length && <div className="lg:col-span-2 p-8 text-center bg-[#F8F6F1] border border-[#D8D2C5] text-xs text-[#5C665F]">No trips have been created yet.</div>}
          </div>
        </>
      ) : (
        <>
          {/* Form tạo hồ sơ người dẫn đoàn */}
          <CatalogForm
            onSubmit={createGuide} validate={() => validateGuide(guideInput)}
            className="grid gap-3 bg-white border border-[#d8d2c5] p-5 md:grid-cols-3"
          >
            <h2 className="md:col-span-3 font-bold text-lg">Create a guide profile</h2>
            <p className="md:col-span-3 text-sm text-gray-600">
              Create a new GUIDE account and its profile together. Upload an avatar after creating the profile.
            </p>
            <label className="text-sm grid gap-1">
              Full name *
              <CatalogField name="fullName" label="Full name"><input required maxLength={150} autoComplete="name"
                className="border border-[#c7cfc9] p-2 rounded-xs"
                value={guideFullName} onChange={(e) => setGuideFullName(e.target.value)} /></CatalogField>
            </label>
            <label className="text-sm grid gap-1">
              Email *
              <CatalogField name="email" label="Email"><input required type="email" maxLength={255} autoComplete="email"
                className="border border-[#c7cfc9] p-2 rounded-xs"
                value={guideEmail} onChange={(e) => setGuideEmail(e.target.value)} /></CatalogField>
            </label>
            <label className="text-sm grid gap-1">
              Phone
              <CatalogField name="phone" label="Phone number"><input type="tel" maxLength={30} autoComplete="tel"
                className="border border-[#c7cfc9] p-2 rounded-xs"
                value={guidePhone} onChange={(e) => setGuidePhone(e.target.value)} /></CatalogField>
            </label>
            <CatalogField name="experienceYears" label="Years of experience"><input max={2147483647} step="1"
              required
              className="border border-[#c7cfc9] p-2 rounded-xs"
              type="number"
              min="0"
              placeholder="Years of field experience *"
              value={guideExperience}
              onChange={(e) => setGuideExperience(e.target.value)}
            /></CatalogField>
            <CatalogField name="specialization" label="Specialization"><input maxLength={1000}
              required
              className="border border-[#c7cfc9] p-2 rounded-xs"
              placeholder="Guiding specialization *"
              value={guideSpecialization}
              onChange={(e) => setGuideSpecialization(e.target.value)}
            /></CatalogField>
            <CatalogField name="languages" label="Languages"><input
              className="border border-[#c7cfc9] p-2 rounded-xs"
              placeholder="Languages, separated by commas"
              value={guideLanguages}
              onChange={(e) => setGuideLanguages(e.target.value)}
            /></CatalogField>
            <CatalogField name="bio" label="Guide biography"><textarea maxLength={5000}
              className="border border-[#c7cfc9] p-2 rounded-xs md:col-span-2"
              rows={2}
              placeholder="Short guide biography"
              value={guideBio}
              onChange={(e) => setGuideBio(e.target.value)}
            /></CatalogField>
            <button className="store-button md:col-span-3" disabled={busy}>
              Create guide account and profile
            </button>
          </CatalogForm>

          {/* Chỉ giữ mật khẩu tạm trong state; không lưu vào storage hoặc log. */}
          {guideCredentials && (
            <div role="status" className="border border-emerald-200 bg-emerald-50 p-4 text-sm space-y-2">
              <b>Guide account created: {guideCredentials.guide.displayName}</b>
              <p>Email: {guideCredentials.email}</p>
              <p>Temporary password: <code className="select-all font-semibold">{guideCredentials.temporaryPassword}</code></p>
              <p>{guideCredentials.emailSent
                ? "Account details have been sent by email."
                : "Account created, but email was not sent. Share these credentials securely with the guide."}</p>
              <p>Ask the guide to change this password after signing in. It will not be shown again after closing this message.</p>
              <button type="button" className="underline" onClick={() => setGuideCredentials(null)}>Close account details</button>
            </div>
          )}

          {/* Bảng danh sách người dẫn đoàn */}
          <div className="overflow-x-auto bg-white border border-[#d8d2c5]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-[#d8d2c5] text-xs uppercase text-gray-600">
                  <th className="p-3">Guide</th>
                  <th className="p-3">Profile</th>
                  <th className="p-3">Availability</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guides.map((guide) => (
                  <tr className="border-t border-[#e5e0d8] hover:bg-gray-50/60" key={guide.guideId}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {guide.avatarUrl ? (
                          <img src={guide.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-[#c7cfc9]" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#e8eee9] text-[#152a20] grid place-items-center font-bold">
                            {guide.displayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <b className="text-base text-[#111D16]">{guide.displayName}</b>
                          <br />
                          <small className="text-gray-500">
                            Account #{guide.userId} · {guide.experienceYears ?? 0} years’ experience
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      <p className="font-medium">{guide.specialization || "Field guiding"}</p>
                      {guide.languages?.length ? <p className="text-xs text-gray-500 mt-1">{guide.languages.join(" · ")}</p> : null}
                      {guide.bio ? <p className="text-xs text-gray-600 mt-1 line-clamp-2">{guide.bio}</p> : null}
                    </td>
                    <td className="p-3">
                      <select
                        className="border border-[#c7cfc9] p-1.5 text-sm rounded-xs bg-white font-medium"
                        value={guide.status}
                        onChange={(e) =>
                          void updateGuideStatus(guide.guideId, e.target.value as GuideStatus)
                        }
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={() => openGuideEditor(guide)} className="border border-[#c7cfc9] bg-white px-2.5 py-1.5 text-xs rounded-xs hover:bg-gray-100">Edit</button>
                        <label className="border border-[#c7cfc9] bg-white px-2.5 py-1.5 text-xs rounded-xs hover:bg-gray-100 cursor-pointer">
                          {guide.avatarUrl ? "Replace avatar" : "Upload avatar"}
                          <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; void uploadGuideAvatar(guide.guideId, file); }} />
                        </label>
                        {guide.avatarUrl ? <button type="button" onClick={() => void deleteGuideAvatar(guide.guideId)} className="text-red-700 border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs rounded-xs hover:bg-red-100">Remove avatar</button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {!guides.length && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      No guide profiles have been created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editingGuide && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <CatalogForm onSubmit={saveGuide} validate={() => validateGuide(guideEditInput)} className="bg-white rounded-xs max-w-lg w-full border border-[#d8d2c5] shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-[#d8d2c5] bg-[#F3EFE6]">
              <div>
                <h3 className="font-bold text-lg text-[#111D16]">Edit guide profile</h3>
                <p className="text-xs text-gray-600">{editingGuide.displayName}</p>
              </div>
              <button type="button" onClick={() => setEditingGuide(null)} className="p-1 hover:bg-gray-200 rounded text-gray-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-sm font-medium">Years of field experience
                <CatalogField name="experienceYears" label="Years of experience"><input max={2147483647} step="1" required min="0" type="number" className="mt-1 w-full border border-[#c7cfc9] p-2 rounded-xs" value={Number.isNaN(guideEditForm.experienceYears) ? "" : guideEditForm.experienceYears} onChange={(e) => setGuideEditForm({ ...guideEditForm, experienceYears: inputNumber(e.target.value) })} /></CatalogField>
              </label>
              <label className="block text-sm font-medium">Guiding specialization
                <CatalogField name="specialization" label="Specialization"><input maxLength={1000} required className="mt-1 w-full border border-[#c7cfc9] p-2 rounded-xs" value={guideEditForm.specialization} onChange={(e) => setGuideEditForm({ ...guideEditForm, specialization: e.target.value })} /></CatalogField>
              </label>
              <label className="block text-sm font-medium">Languages
                <CatalogField name="languages" label="Languages"><input className="mt-1 w-full border border-[#c7cfc9] p-2 rounded-xs" placeholder="English, Vietnamese" value={guideEditLanguages} onChange={(e) => setGuideEditLanguages(e.target.value)} /></CatalogField>
              </label>
              <label className="block text-sm font-medium">Biography
                <CatalogField name="bio" label="Guide biography"><textarea maxLength={5000} className="mt-1 w-full border border-[#c7cfc9] p-2 rounded-xs" rows={4} value={guideEditForm.bio || ""} onChange={(e) => setGuideEditForm({ ...guideEditForm, bio: e.target.value })} /></CatalogField>
              </label>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[#d8d2c5] bg-gray-50">
              <button type="button" onClick={() => setEditingGuide(null)} className="border border-[#c7cfc9] bg-white px-4 py-2 text-sm rounded-xs">Cancel</button>
              <button className="store-button text-sm py-2 px-5" disabled={busy}>{busy ? "Saving..." : "Save profile"}</button>
            </div>
          </CatalogForm>
        </div>
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
                Edit trip (ID: #{editingEventId})
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
              <div className="p-10 text-center text-gray-500">Loading trip details...</div>
            ) : (
              <CatalogForm onSubmit={handleSaveEdit} validate={() => validateEvent(editForm, editingPublished)} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Trip name *</label>
                    <CatalogField name="eventName" label="Tour name"><input maxLength={200}
                      required
                      className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                      value={editForm.eventName}
                      onChange={(e) => setEditForm({ ...editForm, eventName: e.target.value })}
                    /></CatalogField>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Experience type</label>
                    <CatalogField name="eventType" label="Experience type"><select
                      className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm bg-white"
                      value={editForm.eventType}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          eventType: e.target.value as EventInput["eventType"],
                        })
                      }
                    >
                      <option value="TREKKING">Trekking</option>
                      <option value="CAMPING">Camping</option>
                    </select></CatalogField>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Base price (VND)</label>
                    <CatalogField name="basePrice" label="Base price"><input step="0.01" min="0"
                      type="number"
                      required
                      className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                      value={Number.isNaN(editForm.basePrice) ? "" : editForm.basePrice}
                      onChange={(e) =>
                        setEditForm({ ...editForm, basePrice: inputNumber(e.target.value) })
                      }
                    /></CatalogField>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Province/city (required to publish)</label>
                    <CatalogField name="location" label="Province/city"><select

                      className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm bg-white"
                      value={editForm.location ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    >
                      <option value="">Select a province/city</option>
                      {editForm.location && !TOUR_LOCATIONS.includes(editForm.location) && (
                        <option value={editForm.location}>{editForm.location}</option>
                      )}
                      {TOUR_LOCATIONS.map((location) => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select></CatalogField>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Introduction (required to publish)</label>
                  <CatalogField name="description" label="Tour introduction"><textarea maxLength={50000}

                    rows={3}
                    className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                    value={editForm.description ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  /></CatalogField>
                </div>

                <div className="border-t pt-3 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#111D16]">
                    Trip details (required to publish)
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Difficulty</label>
                      <CatalogField name="details.difficultyLevel" label="Difficulty"><select
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
                        <option value="EASY">Easy (beginners)</option>
                        <option value="MODERATE">Moderate (basic fitness)</option>
                        <option value="HARD">Challenging (experienced hikers)</option>
                      </select></CatalogField>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Estimated duration (minutes)
                      </label>
                      <CatalogField name="details.durationMinutes" label="Duration (minutes)"><input max={2147483647} step="1"
                        type="number"
                        min="1"
                        className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                        value={editForm.details?.durationMinutes ?? ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            details: {
                              ...editForm.details,
                              durationMinutes: e.target.value === "" ? undefined : inputNumber(e.target.value),
                            },
                          })
                        }
                      /></CatalogField>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Meeting point (required to publish)
                      </label>
                      <CatalogField name="details.meetingPoint" label="Meeting point"><input maxLength={10000}

                        className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                        placeholder="Example: Field operations station"
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
                      /></CatalogField>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Participation requirements (required to publish)
                      </label>
                      <CatalogField name="details.requirements" label="Participation requirements"><input maxLength={10000}

                        className="w-full border border-[#c7cfc9] p-2 rounded-xs text-sm"
                        placeholder="Example: Good fitness, suitable hiking shoes"
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
                      /></CatalogField>
                    </div>
                  </div>
                </div>

                <TourContentEditor value={editForm.details ?? {}} onChange={details => setEditForm({ ...editForm, details })} />

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingEventId(null)}
                    className="border border-[#c7cfc9] bg-white px-4 py-2 text-sm rounded-xs hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button className="store-button text-sm py-2 px-5" disabled={busy}>
                    {busy ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </CatalogForm>
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
                <h3 className="font-bold text-lg text-[#111D16]">Manage image library</h3>
                <p className="text-xs text-gray-600">{selectedEventTitle} (ID: #{selectedEventId})</p>
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
                  Upload another image
                </h4>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <CatalogField name="imageDescription" label="Image description"><input maxLength={1000}
                    type="text"
                    className="w-full border border-[#c7cfc9] bg-white p-2 text-sm rounded-xs"
                    placeholder="Image description (optional, e.g. Sunset campsite)"
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                  /></CatalogField>
                  <label
                    className={`store-button text-sm py-2 px-4 cursor-pointer flex items-center justify-center gap-2 ${
                      uploadingImage ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingImage ? "Uploading..." : "Choose image"}</span>
                    <input
                      className="hidden"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={imageReadOnly || uploadingImage || imageLayoutDirty || layoutSaving || busy}
                      onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; void handleUploadInsideModal(file); }}
                    />
                  </label>
                </div>
                {imageReadOnly && <p className="text-sm text-amber-700">This archived tour is read-only.</p>}
                {imageError && <p role="alert" className="text-sm text-red-700">{imageError}</p>}
                <small className="text-[11px] text-gray-500 block">
                  JPG, PNG, and WebP up to 5 MB are supported. Choose a cover, arrange the gallery and assign photos to itinerary days below. Save layout changes before uploading or deleting more photos.
                </small>
              </div>

              {/* Danh sách ảnh hiện có */}
              {modalLoading ? (
                <div className="py-12 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                  Loading images...
                </div>
              ) : eventImages.length > 0 ? (
                <div>
                  <h4 className="font-bold text-sm text-[#111D16] mb-3">
                    Current images ({eventImages.length}) {imageLayoutDirty && <span className="text-xs text-amber-700">· Unsaved layout</span>}
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
                            alt={img.description || `Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute top-1.5 left-1.5 bg-[#111D16] text-[#F3EFE6] text-[10px] font-bold px-1.5 py-0.5 rounded-xs tracking-wider">
                              COVER
                            </span>
                          )}
                          <a
                            href={img.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-1.5 left-1.5 bg-black/60 text-white p-1 rounded-xs opacity-0 group-hover:opacity-100 transition"
                            title="Open original image in a new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="p-2 space-y-2 bg-white text-xs">
                          <div className="flex flex-wrap gap-2">
                            {index > 0 && <button type="button" disabled={imageReadOnly || layoutSaving || uploadingImage || busy} className="text-[#173D2C] font-bold" onClick={() => moveImage(index, 0)}>Set as cover</button>}
                            <button type="button" disabled={imageReadOnly || layoutSaving || uploadingImage || busy || index === 0} onClick={() => moveImage(index, index - 1)} aria-label={`Move image ${index + 1} earlier`}>↑ Earlier</button>
                            <button type="button" disabled={imageReadOnly || layoutSaving || uploadingImage || busy || index === eventImages.length - 1} onClick={() => moveImage(index, index + 1)} aria-label={`Move image ${index + 1} later`}>↓ Later</button>
                          </div>
                          <label className="block">Itinerary photo<select aria-label={`Itinerary day for image ${index + 1}`} className="block w-full p-1 mt-1 border border-[#D8D2C5]" disabled={imageReadOnly || layoutSaving || uploadingImage || busy} value={img.dayNumber ?? ""} onChange={e => { const dayNumber = e.target.value ? Number(e.target.value) : null; setEventImages(previous => previous.map(image => image.imageId === img.imageId ? { ...image, dayNumber } : image)); setImageLayoutDirty(true); }}><option value="">Gallery only</option>{imageDays.map(day => <option key={day} value={day}>Day {day}</option>)}</select></label>
                        </div>
                        <div className="p-2 flex items-center justify-between text-xs bg-white">
                          <span
                            className="truncate text-gray-600 max-w-[140px]"
                            title={img.description || `Image ID: #${img.imageId}`}
                          >
                            {img.description || `Image #${img.imageId}`}
                          </span>
                          <button
                            type="button"
                            disabled={imageReadOnly || imageLayoutDirty || layoutSaving || uploadingImage || busy}
                            onClick={() => void handleDeleteImage(img.imageId)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete this image"
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
                  <p className="text-sm font-medium">This trip does not have any images yet.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload at least one image before publishing this trip.
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 pb-3 flex flex-wrap items-center justify-between gap-3"><p className="flex-1 min-w-48 text-xs text-[#5C665F]">First image = cover. Next two = gallery preview. Day assignments are saved separately from gallery order.</p><button type="button" disabled={layoutSaving || uploadingImage || busy || modalLoading} onClick={() => { const item = events.find(event => event.eventId === selectedEventId); if (item) void openImageManager(item); }} className="shrink-0 whitespace-nowrap text-xs underline">{imageLayoutDirty ? "Discard & reload photos" : "Reload photos"}</button><button type="button" disabled={imageReadOnly || !imageLayoutDirty || layoutSaving || uploadingImage || busy} onClick={() => void saveImageLayout()} className="shrink-0 whitespace-nowrap px-4 py-2 bg-[#173D2C] text-white text-xs rounded disabled:opacity-50">{layoutSaving ? "Saving..." : "Save photo layout"}</button></div>
            {/* Chân modal */}
            <div className="p-3 border-t border-[#d8d2c5] bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={closeImageManager}
                className="border border-[#c7cfc9] bg-white px-4 py-2 text-sm rounded-xs hover:bg-gray-100 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
