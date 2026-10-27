import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  Compass,
  Footprints,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  RefreshCw,
  Users,
  Calendar,
  Mountain,
  Tent,
  Utensils,
  Flag,
  PhoneCall,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { eventGuideApi, EventResponse, TourActivity } from "../../services/eventGuideApi";
import { BookingPanel } from "../../features/schedules/BookingPanel";
import { storefrontAssets as images } from "../../data/storefront";

const fallbackImages = [images.tanang, images.camp, images.hike, images.forest];

// Định dạng đúng thời lượng đã nhập, không suy diễn lịch trình hoặc số đêm.
function formatDurationText(minutes?: number | null): { main: string; sub: string } {
  if (!minutes || minutes <= 0) return { main: "Chưa cập nhật", sub: "Thời lượng dự kiến" };
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;
  const parts = [days ? `${days} ngày` : "", hours ? `${hours} giờ` : "", remainingMinutes ? `${remainingMinutes} phút` : ""];
  return { main: parts.filter(Boolean).join(" "), sub: "Thời lượng dự kiến" };
}

// Icon hiển thị theo loại hoạt động
function ActivityIcon({ type }: { type: TourActivity["icon"] }) {
  switch (type) {
    case "meet":
      return <Users className="w-4 h-4 text-[#994717]" />;
    case "hike":
      return <Footprints className="w-4 h-4 text-[#152a20]" />;
    case "food":
      return <Utensils className="w-4 h-4 text-[#994717]" />;
    case "summit":
      return <Mountain className="w-4 h-4 text-emerald-700" />;
    case "camp":
      return <Tent className="w-4 h-4 text-[#D97845]" />;
    case "flag":
      return <Flag className="w-4 h-4 text-emerald-800" />;
    default:
      return <Compass className="w-4 h-4 text-[#152a20]" />;
  }
}

export function ExpeditionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<EventResponse | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeDayTab, setActiveDayTab] = useState(1);

  useEffect(() => {
    if (!id || !/^\d+$/.test(id)) {
      setError("Mã số chuyến đi không hợp lệ.");
      setLoading(false);
      return;
    }
    setLoading(true);
    eventGuideApi
      .getEvent(Number(id))
      .then((data) => {
        setTour(data);
        setSelectedImageIndex(0);
        setActiveDayTab(1);
        setError("");
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Không thể tải thông tin chi tiết của chuyến đi.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="store-home py-24 text-center">
        <div className="store-container space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#152a20]" />
          <p className="text-sm font-semibold text-[#424844]">
            Đang tải thông số và lịch trình chi tiết chuyến đi...
          </p>
        </div>
      </main>
    );
  }

  if (error || !tour) {
    return (
      <main className="store-home py-20">
        <div className="store-container max-w-md text-center space-y-4 bg-white p-8 rounded-md border border-[#e6e2d9] shadow-xs">
          <Compass className="w-10 h-10 text-[#994717] mx-auto" />
          <h2 className="text-xl font-bold text-[#02150c] font-headline">
            {error || "Không tìm thấy chuyến đi"}
          </h2>
          <p className="text-xs text-[#424844] leading-relaxed">
            Hành trình này hiện chưa mở công bố hoặc đã hoàn tất thời gian nhận khách đăng ký.
          </p>
          <Link to="/tours" className="store-button inline-flex items-center gap-1.5 text-xs py-2 px-4">
            <ArrowLeft size={13} />
            Quay lại danh sách chuyến đi
          </Link>
        </div>
      </main>
    );
  }

  const allImages =
    tour.images && tour.images.length > 0
      ? tour.images.map((img) => img.imageUrl)
      : [tour.coverImageUrl || fallbackImages[tour.eventId % fallbackImages.length]];

  const activeImage = allImages[selectedImageIndex] || allImages[0];
  const durationInfo = formatDurationText(tour.details?.durationMinutes);
  const itineraryDays = tour.details?.itinerary ?? [];
  const packingItems = tour.details?.packingItems ?? [];
  const currentDayData = itineraryDays.find((d) => d.day === activeDayTab) || itineraryDays[0];

  const difficultyInfo =
    tour.details?.difficultyLevel === "EASY"
      ? { label: "Nhẹ nhàng", note: "Phù hợp người mới, đường mòn thoai thoải" }
      : tour.details?.difficultyLevel === "HARD"
      ? { label: "Thử thách", note: "Cần thể lực tốt, nhiều dốc đá đòi hỏi sức bền" }
      : tour.details?.difficultyLevel === "MODERATE"
      ? { label: "Trung bình", note: "Yêu cầu thể lực cơ bản" }
      : { label: "Chưa cập nhật", note: "Độ khó sẽ được thông báo sau" };

  return (
    <main className="store-home pb-20">
      {/* 1. Thanh Breadcrumb điều hướng tinh gọn */}
      <nav aria-label="Đường dẫn trang" className="border-b border-[#e6e2d9] bg-[#f7f3ea] py-3">
        <div className="store-container flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Link
              to="/tours"
              className="inline-flex items-center gap-1.5 font-bold text-[#994717] hover:underline uppercase tracking-wider"
            >
              <ArrowLeft size={13} />
              Tất cả chuyến đi
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-[#424844] font-medium truncate max-w-[200px] sm:max-w-md">
              {tour.eventName}
            </span>
          </div>
          <span className="text-gray-500 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#e6e2d9]">
            Mã tour: #{tour.eventId}
          </span>
        </div>
      </nav>

      <div className="store-container py-6 space-y-6">
        {/* 2. Tiêu đề chính & Huy hiệu thông số đầu trang */}
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#152a20] text-white text-[10px] font-bold px-2.5 py-1 rounded-xs tracking-wider uppercase inline-flex items-center gap-1">
              <Footprints size={11} />
              {tour.eventType === "TREKKING" ? "Đi bộ dã ngoại" : "Cắm trại sinh tồn"}
            </span>
            <span className="bg-[#e9e4da] text-[#152a20] text-[10px] font-bold px-2.5 py-1 rounded-xs tracking-wider uppercase border border-[#d8d2c5]">
              {difficultyInfo.label}
            </span>
            <span className="text-xs text-[#994717] font-semibold flex items-center gap-1 ml-auto bg-[#f7f3ea] px-3 py-1 rounded border border-[#e6e2d9]">
              <MapPin size={13} className="text-[#994717]" />
              {tour.location || "Vùng núi cao Việt Nam"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#02150c] font-headline tracking-tight">
            {tour.eventName}
          </h1>
        </header>

        {/* 3. Khu vực Thư viện hình ảnh sắc nét */}
        <div className="space-y-2.5">
          <div className="relative aspect-16/9 md:aspect-21/9 w-full rounded-md overflow-hidden bg-gray-200 border border-[#e6e2d9] shadow-xs">
            <img
              src={activeImage}
              alt={tour.eventName}
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5">
              <MapPin size={13} className="text-[#D97845]" />
              <span className="font-medium">{tour.location || "Điểm đến thực địa"}</span>
            </div>
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {allImages.map((imgUrl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-14 shrink-0 rounded overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx
                      ? "border-[#994717] opacity-100 ring-2 ring-[#994717]/30"
                      : "border-transparent opacity-60 hover:opacity-90"
                  }`}
                  aria-label={`Xem ảnh số ${idx + 1}`}
                >
                  <img src={imgUrl} alt={`Ảnh số ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Thanh 4 thông số kỹ thuật cốt lõi (Chuẩn hóa tự nhiên) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3.5 rounded-md flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
              <Clock3 size={12} className="text-[#994717]" /> Thời lượng
            </span>
            <div className="mt-1">
              <p className="text-sm font-bold text-[#02150c]">{durationInfo.main}</p>
              <span className="text-[10px] text-gray-500 block truncate">{durationInfo.sub}</span>
            </div>
          </div>

          <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3.5 rounded-md flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
              <Compass size={12} className="text-[#152a20]" /> Độ khó cung đường
            </span>
            <div className="mt-1">
              <p className="text-sm font-bold text-[#02150c]">{difficultyInfo.label}</p>
              <span className="text-[10px] text-gray-500 block truncate">{difficultyInfo.note}</span>
            </div>
          </div>

          <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3.5 rounded-md flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
              <Footprints size={12} className="text-[#994717]" /> Loại trải nghiệm
            </span>
            <div className="mt-1">
              <p className="text-sm font-bold text-[#02150c]">
                {tour.eventType === "TREKKING" ? "Đi bộ dã ngoại" : "Cắm trại sinh tồn"}
              </p>
              <span className="text-[10px] text-gray-500 block">Địa hình núi đồi tự nhiên</span>
            </div>
          </div>

          <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3.5 rounded-md flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
              <Users size={12} className="text-[#152a20]" /> Quy mô an toàn
            </span>
            <div className="mt-1">
              <p className="text-sm font-bold text-[#02150c]">Theo lịch khởi hành</p>
              <span className="text-[10px] text-gray-500 block">Xem số chỗ và hướng dẫn viên khi chọn lịch</span>
            </div>
          </div>
        </div>

        {/* 5. Bố cục 2 cột chính: Chi tiết & Đặt chỗ */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr] items-start">
          {/* CỘT TRÁI: Nội dung chi tiết & Lịch trình từng ngày */}
          <article className="space-y-6 min-w-0">
            <section className="bg-white border border-[#e6e2d9] rounded-md p-5 space-y-2">
              <h2 className="text-base font-bold text-[#02150c] font-headline">Tổng quan chuyến đi</h2>
              <p className="text-sm text-[#424844] whitespace-pre-line leading-relaxed">
                {tour.description || "Nội dung giới thiệu đang được cập nhật."}
              </p>
            </section>

            {/* Thanh điều hướng nội dung nhanh */}
            <div className="flex items-center gap-2 border-b border-[#e6e2d9] pb-2 text-xs font-bold uppercase tracking-wider">
              <a
                href="#itinerary"
                className="px-3 py-1.5 rounded-sm bg-[#152a20] text-white flex items-center gap-1.5 transition-colors"
              >
                <Calendar size={13} />
                Lịch trình từng ngày
              </a>
              <a
                href="#specs"
                className="px-3 py-1.5 rounded-sm bg-[#f7f3ea] text-[#152a20] hover:bg-[#ebe6dc] border border-[#e6e2d9] flex items-center gap-1.5 transition-colors"
              >
                <PackageCheck size={13} />
                Thông số & Trang bị
              </a>
            </div>

            {/* MỤC 1: LỊCH TRÌNH CHI TIẾT TỪNG NGÀY & HOẠT ĐỘNG (Phân trang từng ngày & Ít chữ lại) */}
            <section id="itinerary" className="bg-white border border-[#e6e2d9] rounded-md p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e2d9] pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#994717] tracking-wider font-mono flex items-center gap-1">
                    <Sparkles size={11} />
                    LỊCH TRÌNH THEO TỪNG NGÀY
                  </span>
                  <h2 className="text-lg md:text-xl font-bold text-[#02150c] font-headline mt-0.5">
                    Hoạt động thực địa
                  </h2>
                </div>

                {/* Phân trang ngày ở đầu mục */}
                {itineraryDays.length > 1 ? (
                  <div className="flex items-center gap-1.5 bg-[#f7f3ea] p-1 rounded-sm border border-[#e6e2d9]">
                    <button
                      type="button"
                      disabled={activeDayTab <= 1}
                      onClick={() => setActiveDayTab((prev) => Math.max(1, prev - 1))}
                      className="px-2.5 py-1 text-xs font-semibold text-[#152a20] rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                      title="Ngày trước"
                    >
                      <ChevronLeft size={13} />
                      <span>Ngày trước</span>
                    </button>

                    <div className="flex items-center gap-1 px-1 overflow-x-auto max-w-[50vw]">
                      {itineraryDays.map((d) => (
                        <button
                          key={d.day}
                          type="button"
                          onClick={() => setActiveDayTab(d.day)}
                          className={`h-7 px-2.5 rounded text-xs font-bold transition-all ${
                            activeDayTab === d.day
                              ? "bg-[#994717] text-white shadow-xs"
                              : "text-[#424844] hover:bg-white"
                          }`}
                        >
                          Ngày {d.day}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={activeDayTab >= itineraryDays.length}
                      onClick={() => setActiveDayTab((prev) => Math.min(itineraryDays.length, prev + 1))}
                      className="px-2.5 py-1 text-xs font-semibold text-[#152a20] rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                      title="Ngày sau"
                    >
                      <span>Ngày sau</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs bg-[#f7f3ea] text-[#152a20] font-bold px-2.5 py-1 rounded border border-[#e6e2d9]">
                    {itineraryDays.length === 1 ? "1 ngày trong lịch trình" : "Chưa cập nhật"}
                  </span>
                )}
              </div>

              {currentDayData ? <>
              {/* Thẻ tóm tắt thông số chặng của ngày đang xem */}
              <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3.5 rounded-md space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <h3 className="font-bold text-sm md:text-base text-[#02150c] font-headline">
                    Ngày {currentDayData.day}: {currentDayData.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-[#994717] font-semibold shrink-0">
                    <span>📏 Cự ly: {currentDayData.distanceKm || "Chưa cập nhật"}</span>
                    <span>📈 Độ cao: {currentDayData.elevation || "Chưa cập nhật"}</span>
                  </div>
                </div>

                <p className="text-xs text-[#424844] leading-relaxed">
                  {currentDayData.summary}
                </p>

                {/* Các điểm nhấn nổi bật trong ngày */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {currentDayData.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="bg-white text-[#152a20] text-[11px] font-medium px-2 py-0.5 rounded border border-[#e6e2d9] flex items-center gap-1"
                    >
                      <CheckCircle2 size={11} className="text-emerald-700" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* DÒNG THỜI GIAN HOẠT ĐỘNG (Ít chữ, mốc rõ ràng) */}
              <div className="space-y-3 pt-1">
                <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#d8d2c5]">
                  {currentDayData.activities.length === 0 && <p className="text-xs text-[#5C665F]">Hoạt động trong ngày đang được cập nhật.</p>}
                  {currentDayData.activities.map((act, index) => (
                    <div className="relative group" key={index}>
                      {/* Chấm icon trên dòng thời gian */}
                      <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#994717] flex items-center justify-center shadow-xs">
                        <ActivityIcon type={act.icon} />
                      </span>

                      {/* Hộp nội dung hoạt động súc tích */}
                      <div className="bg-[#fbf9f5] border border-[#e6e2d9] rounded-md p-3 space-y-1 hover:border-[#994717] transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#994717] bg-[#f7f3ea] px-2 py-0.5 rounded font-mono border border-[#e6e2d9]">
                              {act.time}
                            </span>
                            <h4 className="font-bold text-xs sm:text-sm text-[#02150c]">
                              {act.title}
                            </h4>
                          </div>
                          {act.location && (
                            <span className="text-[11px] text-gray-500 flex items-center gap-1 shrink-0">
                              <MapPin size={11} className="text-[#994717]" />
                              {act.location}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#424844] leading-relaxed">
                          {act.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              </> : <p className="text-sm text-[#5C665F] py-4">Lịch trình chi tiết đang được cập nhật.</p>}

              {/* Phân trang ngày ở cuối nội dung */}
              {currentDayData && itineraryDays.length > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-[#e6e2d9] text-xs">
                  <button
                    type="button"
                    disabled={activeDayTab <= 1}
                    onClick={() => {
                      setActiveDayTab((prev) => Math.max(1, prev - 1));
                    }}
                    className="store-button-secondary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={13} />
                    <span>Ngày trước</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs text-[#5C665F]">
                    <span>Đang xem:</span>
                    <span className="font-bold text-[#02150c] bg-[#f7f3ea] px-2.5 py-0.5 rounded border border-[#e6e2d9]">
                      Ngày {currentDayData.day} / {itineraryDays.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={activeDayTab >= itineraryDays.length}
                    onClick={() => {
                      setActiveDayTab((prev) => Math.min(itineraryDays.length, prev + 1));
                    }}
                    className="store-button-secondary text-xs py-1.5 px-3 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Ngày sau</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </section>

            {/* MỤC 2: THÔNG SỐ KỸ THUẬT & DANH MỤC TRANG BỊ CẦN CHUẨN BỊ */}
            <section className="bg-white border border-[#e6e2d9] rounded-md p-5 space-y-4 shadow-xs" id="specs">
              <h2 className="text-base font-bold text-[#02150c] font-headline flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[#152a20]" />
                Thông số kỹ thuật & Danh mục trang bị cần chuẩn bị
              </h2>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-[#f7f3ea] rounded-md border border-[#e6e2d9] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
                    <MapPin size={12} className="text-[#994717]" /> Điểm tập kết & Đón khách
                  </span>
                  <p className="font-semibold text-[#02150c]">
                    {tour.details?.meetingPoint || "Điểm tập kết đang được cập nhật"}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Có mặt trước giờ khởi hành ít nhất 20 phút để kiểm tra trang bị và khởi động.
                  </p>
                </div>

                <div className="p-3.5 bg-[#f7f3ea] rounded-md border border-[#e6e2d9] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
                    <Compass size={12} className="text-[#152a20]" /> Yêu cầu thể lực & Sức khỏe
                  </span>
                  <p className="font-semibold text-[#02150c]">
                    {difficultyInfo.label} — {difficultyInfo.note}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {tour.details?.requirements || "Yêu cầu tham gia đang được cập nhật."}
                  </p>
                </div>
              </div>

              {/* Danh sách trang bị cá nhân cần chuẩn bị (Checklist) */}
              <div className="border-t border-[#e6e2d9] pt-3 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#02150c] font-mono flex items-center gap-1.5">
                  <PackageCheck size={13} className="text-[#994717]" />
                  Danh mục trang bị cá nhân khuyến nghị
                </h3>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {packingItems.length === 0 && <p className="text-[#5C665F]">Danh mục trang bị đang được cập nhật.</p>}
                  {packingItems.map((pi, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 bg-[#fbf9f5] p-2.5 rounded border border-[#e6e2d9]"
                    >
                      <CheckCircle2
                        size={14}
                        className={`shrink-0 mt-0.5 ${
                          pi.required ? "text-[#994717]" : "text-gray-400"
                        }`}
                      />
                      <span className={pi.required ? "font-medium text-[#02150c]" : "text-[#5C665F]"}>
                        {pi.text} {pi.required ? <b className="text-[#994717]">*</b> : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </article>

          {/* CỘT PHẢI: Bảng đặt chỗ cố định (Booking Panel & Hotline) */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            {/* Component BookingPanel của Module 5 */}
            <div className="bg-white border border-[#e6e2d9] rounded-md shadow-sm overflow-hidden">
              <BookingPanel eventId={tour.eventId} eventName={tour.eventName} price={tour.basePrice} />
            </div>

            {/* Hộp cam kết & hỗ trợ nhanh */}
            <div className="bg-[#f7f3ea] border border-[#e6e2d9] rounded-md p-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#152a20] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#994717]" />
                <span>Cam kết dịch vụ TerraPeak</span>
              </div>
              <ul className="space-y-1.5 text-[#5C665F]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-700 shrink-0" />
                  <span>Xác nhận chỗ tức thì khi thanh toán thành công</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-700 shrink-0" />
                  <span>Hoàn tiền 100% nếu chuyến đi bị hủy do thời tiết cực đoan</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-700 shrink-0" />
                  <span>Tư vấn thể lực và chọn giày leo núi miễn phí</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-[#e6e2d9] flex items-center justify-between text-xs">
                <span className="text-gray-500">Cần tư vấn đoàn riêng?</span>
                <span className="font-bold text-[#994717] flex items-center gap-1 font-mono">
                  <PhoneCall size={12} />
                  1900 8122
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
