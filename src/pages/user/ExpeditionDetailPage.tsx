import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
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
} from "lucide-react";
import { eventGuideApi, EventResponse } from "../../services/eventGuideApi";
import { BookingPanel } from "../../features/schedules/BookingPanel";
import { storefrontAssets as images } from "../../data/storefront";

const fallbackImages = [images.tanang, images.camp, images.hike, images.forest];

export function ExpeditionDetailPage() {
  const { id } = useParams();
  const [tour, setTour] = useState<EventResponse | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => {
    if (!id || !/^\d+$/.test(id)) {
      setError("Invalid trip ID.");
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
        setError(cause instanceof Error ? cause.message : "Unable to load trip details.");
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
            Loading trip details...
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
            {error || "Trip not found"}
          </h2>
          <p className="text-xs text-[#424844]">
            This trip is not currently open for registration or its registration period has ended.
          </p>
          <Link to="/tours" className="store-button inline-flex items-center gap-1.5 text-xs py-2 px-4">
            <ArrowLeft size={13} />
            Back to trips
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
      ? `${Math.round(tour.details.durationMinutes / 1440)} days${
          Math.round(tour.details.durationMinutes / 1440) > 1 ? ", 1 night" : ""
        }`
      : `${tour.details.durationMinutes} minutes`
    : "2 days, 1 night";

  const difficultyText =
    tour.details?.difficultyLevel === "EASY"
      ? "Easy (beginner friendly)"
      : tour.details?.difficultyLevel === "HARD"
      ? "Challenging (experienced hikers)"
      : "Moderate (basic fitness)";

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
            All trips
          </Link>
          <span className="text-gray-500 font-mono text-[11px]">Trip ID: #{tour.eventId}</span>
        </div>
      </div>

      <div className="store-container py-6 space-y-6">
        {/* Tiêu đề đầu trang & Tags thông số chính */}
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#152a20] text-white text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-wider uppercase">
              {tour.eventType === "TREKKING" ? "Trekking" : "Camping"}
            </span>
            <span className="bg-[#e9e4da] text-[#152a20] text-[10px] font-bold px-2 py-0.5 rounded-xs tracking-wider uppercase">
              {tour.details?.difficultyLevel === "EASY"
                ? "Easy"
                : tour.details?.difficultyLevel === "HARD"
                ? "Challenging"
                : "Moderate"}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1 ml-auto">
              <MapPin size={12} className="text-[#994717]" />
              {tour.location || "Vietnamese highlands"}
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
              <span>{tour.location || "Trip area"}</span>
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
                  <img src={imgUrl} alt={`Trip photo ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thanh 4 thông số cốt lõi */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3 rounded-md">
            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
              <Clock3 size={11} className="text-[#994717]" /> Duration
            </span>
            <p className="text-xs font-bold text-[#02150c] mt-0.5">{durationText}</p>
          </div>

          <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3 rounded-md">
            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
              <Compass size={11} className="text-[#152a20]" /> Difficulty
            </span>
            <p className="text-xs font-bold text-[#02150c] mt-0.5">
              {tour.details?.difficultyLevel === "EASY"
                ? "Easy"
                : tour.details?.difficultyLevel === "HARD"
                ? "Challenging"
                : "Moderate"}
            </p>
          </div>

          <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3 rounded-md">
            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
              <Footprints size={11} className="text-[#994717]" /> Experience
            </span>
            <p className="text-xs font-bold text-[#02150c] mt-0.5">
              {tour.eventType === "TREKKING" ? "Trekking" : "Camping"}
            </p>
          </div>

          <div className="bg-[#f7f3ea] border border-[#e6e2d9] p-3 rounded-md">
            <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
              <Users size={11} className="text-[#152a20]" /> Group size
            </span>
            <p className="text-xs font-bold text-[#02150c] mt-0.5">12–16 guests</p>
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
                About this trip
              </h2>
              <div className="text-xs md:text-sm text-[#424844] leading-relaxed">
                <p className={!isDescExpanded && isLongDescription ? "line-clamp-3" : ""}>
                  {tour.description || "A carefully designed outdoor experience, operated with safety in mind."}
                </p>
                {isLongDescription && (
                  <button
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="mt-2 text-xs font-semibold text-[#994717] hover:underline inline-flex items-center gap-1"
                  >
                    {isDescExpanded ? (
                      <>Show less <ChevronUp size={13} /></>
                    ) : (
                      <>Read more <ChevronDown size={13} /></>
                    )}
                  </button>
                )}
              </div>
            </section>

            {/* Thông số kỹ thuật & Yêu cầu gọn gàng */}
            <section className="bg-white border border-[#e6e2d9] rounded-md p-5 space-y-3">
              <h2 className="text-base font-bold text-[#02150c] font-headline flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#152a20]" />
                Details & requirements
              </h2>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#f7f3ea] rounded border border-[#e6e2d9] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
                    <MapPin size={11} className="text-[#994717]" /> Meeting point
                  </span>
                  <p className="font-semibold text-[#02150c] truncate">
                    {tour.details?.meetingPoint || "TerraPeak outdoor station"}
                  </p>
                </div>

                <div className="p-3 bg-[#f7f3ea] rounded border border-[#e6e2d9] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
                    <Compass size={11} className="text-[#152a20]" /> Fitness level
                  </span>
                  <p className="font-semibold text-[#02150c]">
                    {difficultyText}
                  </p>
                </div>

                <div className="p-3 bg-[#f7f3ea] rounded border border-[#e6e2d9] space-y-1 sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
                    <PackageCheck size={11} className="text-[#994717]" /> What to bring
                  </span>
                  <p className="text-[#424844]">
                    {tour.details?.requirements ||
                      "Appropriate hiking shoes, a 20–30 L backpack, a personal water bottle, and suitable outdoor clothing."}
                  </p>
                </div>
              </div>
            </section>

            {/* Dịch vụ bao gồm - checklist icon ngắn gọn */}
            <section className="bg-[#f7f3ea] border border-[#e6e2d9] rounded-md p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#02150c] font-headline flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[#994717]" />
                What’s included
              </h3>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-[#152a20]">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-[#e6e2d9]/70">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Trip leader and guide throughout the route</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-[#e6e2d9]/70">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Camping tent, sleeping bag, and insulated mat</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-[#e6e2d9]/70">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Rescue cover and medical evacuation support</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-[#e6e2d9]/70">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Satellite navigation equipment and first-aid kit</span>
                </div>
              </div>
            </section>
          </article>

          <aside>
            <BookingPanel eventId={tour.eventId} eventName={tour.eventName} price={tour.basePrice} />
          </aside>
        </div>
      </div>
    </main>
  );
}
