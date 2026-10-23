import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Compass,
  Footprints,
  MapPin,
  ShieldCheck,
  Award,
  CheckCircle2,
  PackageCheck,
  RefreshCw,
  Users,
  ChevronDown,
  ChevronUp,
  Phone,
  X,
} from "lucide-react";
import { eventGuideApi, EventResponse } from "../../services/eventGuideApi";
import { storefrontAssets as images } from "../../data/storefront";

const vnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const fallbackImages = [images.tanang, images.camp, images.hike, images.forest];

export function ExpeditionDetailPage() {
  const { id } = useParams();
  const [tour, setTour] = useState<EventResponse | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isReservationPromptOpen, setIsReservationPromptOpen] = useState(false);

  useEffect(() => {
    if (!id || !/^\d+$/.test(id)) {
      setError("Mã hành trình không hợp lệ.");
      setLoading(false);
      return;
    }
    setLoading(true);
    eventGuideApi
      .getEvent(Number(id))
      .then((data) => {
        setTour(data);
        setSelectedImageIndex(0);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Không thể tải thông tin chuyến đi.");
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
            Đang tải thông tin chuyến đi...
          </p>
        </div>
      </main>
    );
  }

  if (error || !tour) {
    return (
      <main className="store-home py-20">
        <div className="store-container max-w-md text-center space-y-4 bg-white p-8 rounded-md border border-[#e6e2d9]">
          <Compass className="w-10 h-10 text-[#994717] mx-auto" />
          <h2 className="text-xl font-bold text-[#02150c] font-headline">
            {error || "Hành trình không tồn tại"}
          </h2>
          <p className="text-xs text-[#424844]">
            Hành trình này hiện chưa mở hoặc đã kết thúc thời gian đăng ký.
          </p>
          <Link to="/tours" className="store-button inline-flex items-center gap-1.5 text-xs py-2 px-4">
            <ArrowLeft size={13} />
            Quay lại danh sách
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

  const durationText = tour.details?.durationMinutes
    ? tour.details.durationMinutes >= 1440
      ? `${Math.round(tour.details.durationMinutes / 1440)} ngày ${
          Math.round(tour.details.durationMinutes / 1440) > 1 ? "đêm" : ""
        }`
      : `${tour.details.durationMinutes} phút`
    : "2 ngày 1 đêm";

  const difficultyText =
    tour.details?.difficultyLevel === "EASY"
      ? "Dễ (Phù hợp người mới)"
      : tour.details?.difficultyLevel === "HARD"
      ? "Thử thách (Kinh nghiệm cao)"
      : "Vừa sức (Thể lực cơ bản)";

  const isLongDescription = (tour.description || "").length > 250;

  return (
    <main className="store-home pb-16">
      {/* Thanh điều hướng quay lại tinh gọn */}
      <div className="border-b border-[#e6e2d9] bg-[#f7f3ea] py-3">
        <div className="store-container flex items-center justify-between text-xs">
          <Link
            to="/tours"
            className="inline-flex items-center gap-1.5 font-bold text-[#994717] hover:underline uppercase tracking-wider"
          >
            <ArrowLeft size={13} />
            Danh sách chuyến đi
          </Link>
          <span className="text-gray-500 font-mono text-[11px]">Mã tour: #{tour.eventId}</span>
        </div>
      </div>

      <div className="store-container py-6 space-y-6">
        {/* Tiêu đề đầu trang & Tags thông số chính */}
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#152a20] text-white text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-wider uppercase">
              {tour.eventType === "TREKKING" ? "Leo núi" : "Cắm trại"}
            </span>
            <span className="bg-[#e9e4da] text-[#152a20] text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-wider uppercase">
              {tour.details?.difficultyLevel === "EASY"
                ? "Dễ"
                : tour.details?.difficultyLevel === "HARD"
                ? "Thử thách"
                : "Vừa sức"}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1 ml-auto">
              <MapPin size={12} className="text-[#994717]" />
              {tour.location || "Cao nguyên Việt Nam"}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-[#02150c] font-headline">
            {tour.eventName}
          </h1>
        </header>

        {/* Thư viện hình ảnh */}
        <div className="space-y-2.5">
          {/* Ảnh lớn chính */}
          <div className="relative aspect-16/9 md:aspect-21/9 w-full rounded-md overflow-hidden bg-gray-200 border border-[#e6e2d9]">
            <img
              src={activeImage}
              alt={tour.eventName}
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute bottom-2.5 left-2.5 bg-black/65 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded flex items-center gap-1.5">
              <MapPin size={12} className="text-[#D97845]" />
              <span>{tour.location || "Địa bàn thực địa"}</span>
            </div>
          </div>

          {/* Dải ảnh nhỏ bên dưới */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((imgUrl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-18 h-12 shrink-0 rounded overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx
                      ? "border-[#994717] opacity-100"
                      : "border-transparent opacity-60 hover:opacity-90"
                  }`}
                >
                  <img src={imgUrl} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thanh 4 thông số cốt lõi */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3 rounded-md">
            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
              <Clock3 size={11} className="text-[#994717]" /> Thời lượng
            </span>
            <p className="text-xs font-bold text-[#02150c] mt-0.5">{durationText}</p>
          </div>

          <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3 rounded-md">
            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
              <Compass size={11} className="text-[#152a20]" /> Độ khó
            </span>
            <p className="text-xs font-bold text-[#02150c] mt-0.5">
              {tour.details?.difficultyLevel === "EASY"
                ? "Dễ"
                : tour.details?.difficultyLevel === "HARD"
                ? "Thử thách"
                : "Vừa sức"}
            </p>
          </div>

          <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3 rounded-md">
            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
              <Footprints size={11} className="text-[#994717]" /> Hình thức
            </span>
            <p className="text-xs font-bold text-[#02150c] mt-0.5">
              {tour.eventType === "TREKKING" ? "Leo núi" : "Cắm trại"}
            </p>
          </div>

          <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3 rounded-md">
            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
              <Users size={11} className="text-[#152a20]" /> Quy mô
            </span>
            <p className="text-xs font-bold text-[#02150c] mt-0.5">12 - 16 khách</p>
          </div>
        </div>

        {/* Bố cục nội dung và thẻ đặt chỗ */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Cột trái: Giới thiệu, Yêu cầu & Dịch vụ */}
          <article className="space-y-5">
            {/* Giới thiệu hành trình */}
            <section className="bg-white border border-[#e6e2d9] rounded-md p-5 space-y-3">
              <h2 className="text-base font-bold text-[#02150c] font-headline flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#994717]" />
                Giới thiệu chuyến đi
              </h2>
              <div className="text-xs md:text-sm text-[#424844] leading-relaxed">
                <p className={!isDescExpanded && isLongDescription ? "line-clamp-3" : ""}>
                  {tour.description || "Hành trình trải nghiệm thiên nhiên được thiết kế chu đáo và vận hành an toàn."}
                </p>
                {isLongDescription && (
                  <button
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="mt-2 text-xs font-semibold text-[#994717] hover:underline inline-flex items-center gap-1"
                  >
                    {isDescExpanded ? (
                      <>Thu gọn <ChevronUp size={13} /></>
                    ) : (
                      <>Xem thêm <ChevronDown size={13} /></>
                    )}
                  </button>
                )}
              </div>
            </section>

            {/* Thông số kỹ thuật & Yêu cầu gọn gàng */}
            <section className="bg-white border border-[#e6e2d9] rounded-md p-5 space-y-3">
              <h2 className="text-base font-bold text-[#02150c] font-headline flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#152a20]" />
                Thông số & Yêu cầu
              </h2>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#f7f3ea] rounded border border-[#e6e2d9] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
                    <MapPin size={11} className="text-[#994717]" /> Điểm tập trung
                  </span>
                  <p className="font-semibold text-[#02150c] truncate">
                    {tour.details?.meetingPoint || "Trạm dã ngoại TerraPeak"}
                  </p>
                </div>

                <div className="p-3 bg-[#f7f3ea] rounded border border-[#e6e2d9] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
                    <Compass size={11} className="text-[#152a20]" /> Thể lực
                  </span>
                  <p className="font-semibold text-[#02150c]">
                    {difficultyText}
                  </p>
                </div>

                <div className="p-3 bg-[#f7f3ea] rounded border border-[#e6e2d9] space-y-1 sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
                    <PackageCheck size={11} className="text-[#994717]" /> Trang bị cần chuẩn bị
                  </span>
                  <p className="text-[#424844]">
                    {tour.details?.requirements ||
                      "Giày trekking chuyên dụng, balo 20-30L, bình nước cá nhân và trang phục dã ngoại phù hợp."}
                  </p>
                </div>
              </div>
            </section>

            {/* Dịch vụ bao gồm - checklist icon ngắn gọn */}
            <section className="bg-[#f7f3ea] border border-[#e6e2d9] rounded-md p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#02150c] font-headline flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[#994717]" />
                Dịch vụ bao gồm trọn gói
              </h3>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-[#152a20]">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-[#e6e2d9]/70">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Trưởng đoàn & HDV dẫn đường suốt tuyến</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-[#e6e2d9]/70">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Trọn bộ lều trại, túi ngủ & nệm cách nhiệt</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-[#e6e2d9]/70">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Bảo hiểm cứu hộ & sơ tán y tế</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-[#e6e2d9]/70">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Thiết bị định vị vệ tinh & túi sơ cứu y tế</span>
                </div>
              </div>
            </section>
          </article>

          {/* Cột phải: Thẻ đặt chỗ & Giá niêm yết */}
          <aside className="space-y-4">
            <div className="bg-white border border-[#e6e2d9] rounded-md p-5 sticky top-24 space-y-4 shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
                  Chi phí niêm yết
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-[#02150c] font-headline">
                    {vnd(tour.basePrice)}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">/ Khách</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  ✓ Trọn gói, không phụ phí ẩn
                </p>
              </div>

              {/* Tình trạng chỗ */}
              <div className="bg-[#f7f3ea] p-2.5 rounded border border-[#e6e2d9] space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#994717]">Lịch khởi hành</span>
                  <span className="text-[#02150c]">Còn 5/16 suất</span>
                </div>
                <progress value={11} max={16} aria-label="Tiến độ nhận đoàn" className="w-full h-1.5" />
              </div>

              {/* Nút hành động */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  className="store-button w-full text-center py-2.5 block text-xs font-bold"
                  onClick={() => setIsReservationPromptOpen(true)}
                >
                  Đăng ký tham gia chuyến đi
                </button>
                <Link
                  to="/tours"
                  className="border border-[#c7cfc9] bg-white text-[#152a20] hover:bg-gray-50 text-xs py-2 px-3 rounded-xs w-full text-center block font-semibold transition-colors"
                >
                  Xem các hành trình khác
                </Link>
              </div>

              {/* Chính sách tóm tắt */}
              <div className="border-t border-[#e6e2d9] pt-3 text-[11px] text-gray-500 space-y-1">
                <p>• Hoàn 100% nếu báo hủy trước 7 ngày.</p>
                <p>• Giảm 20% khi thuê thêm dụng cụ dã ngoại kèm.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
      {isReservationPromptOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#02150c]/70 px-4 py-4 backdrop-blur-sm sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsReservationPromptOpen(false);
          }}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-prompt-title"
            className="w-full max-w-md overflow-hidden rounded-lg border border-[#d8d2c5] bg-[#fdf9f0] shadow-[0_24px_80px_rgba(2,21,12,0.38)]"
          >
            <header className="flex items-start justify-between border-b border-[#e6e2d9] bg-[#f7f3ea] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#152a20] text-[#f5b46f]">
                  <CalendarDays size={19} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#994717]">Đăng ký hành trình</p>
                  <h2 id="reservation-prompt-title" className="font-headline text-lg font-bold text-[#02150c]">Giữ chỗ cùng TerraPeak</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReservationPromptOpen(false)}
                aria-label="Đóng thông báo đăng ký"
                className="rounded p-1.5 text-[#59635d] transition hover:bg-[#e9e4da] hover:text-[#02150c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#994717]"
              >
                <X size={19} />
              </button>
            </header>
            <div className="space-y-4 px-5 py-5">
              <div className="rounded-md border border-[#e6e2d9] bg-white px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#717871]">Chuyến đi bạn quan tâm</p>
                <p className="mt-1 font-semibold text-[#02150c]">{tour.eventName}</p>
                <p className="mt-1 text-xs text-[#59635d]">{vnd(tour.basePrice)} / khách · Còn 5/16 suất</p>
              </div>
              <p className="text-sm leading-6 text-[#424844]">
                Đăng ký trực tuyến đang được hoàn thiện. Đội ngũ TerraPeak có thể kiểm tra lịch và giữ chỗ cho bạn ngay hôm nay.
              </p>
              <a
                href="tel:+842888997325"
                className="store-button flex w-full items-center justify-center gap-2 py-3 text-xs font-bold"
              >
                <Phone size={16} /> Gọi hotline giữ chỗ
              </a>
              <button
                type="button"
                onClick={() => setIsReservationPromptOpen(false)}
                className="w-full rounded border border-[#c7cfc9] bg-white px-3 py-2.5 text-xs font-bold text-[#152a20] transition hover:bg-[#f7f3ea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#994717]"
              >
                Tôi sẽ xem thêm sau
              </button>
              <p className="text-center text-[11px] text-[#717871]">Không có thanh toán hoặc thông tin cá nhân nào được gửi ở bước này.</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
