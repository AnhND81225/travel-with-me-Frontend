import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  Compass,
  Footprints,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Award,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  eventGuideApi,
  EventSummary,
  EventType,
  DifficultyLevel,
  PublicGuide,
} from "../../services/eventGuideApi";
import { storefrontAssets as images } from "../../data/storefront";

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to load tours.";

const vnd = (amount: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const fallbackImages = [images.tanang, images.camp, images.hike, images.forest];

export function ExpeditionsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [guides, setGuides] = useState<PublicGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Phân trang: 9 tour / 1 trang
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Bộ lọc
  const [keyword, setKeyword] = useState("");
  const [eventType, setEventType] = useState<EventType | "">("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "">("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [eventPage, guidePage] = await Promise.all([
        eventGuideApi.listEvents({
          keyword: keyword.trim() || undefined,
          eventType: eventType || undefined,
          difficultyLevel: difficulty || undefined,
          page,
          size: 9,
        }),
        eventGuideApi.listGuides({ size: 8 }),
      ]);
      setEvents(eventPage.items);
      setTotalPages(eventPage.totalPages);
      setTotalElements(eventPage.totalElements);
      setGuides(guidePage.items);
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, eventType, difficulty]);

  const search = (e: FormEvent) => {
    e.preventDefault();
    setPage(0);
    void load();
  };

  const clearFilters = () => {
    setKeyword("");
    setEventType("");
    setDifficulty("");
    setPage(0);
  };

  const hasActiveFilters = Boolean(keyword || eventType || difficulty);

  return (
    <main className="store-home">
      {/* Banner đầu trang tinh gọn */}
      <section className="border-b border-[#e6e2d9] bg-[#f7f3ea] py-8 md:py-10">
        <div className="store-container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="store-eyebrow">
                <Compass className="inline-block w-3.5 h-3.5 mr-1 text-[#994717]" />
                OUTDOOR EXPERIENCES
              </span>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-[#02150c] font-headline">
                Tours & Events
              </h1>
              <p className="text-sm text-[#424844]">
                Trekking and camping adventures led by experienced guides, with rescue insurance and equipment provided.
              </p>
            </div>

            {/* 3 cam kết nhanh */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#152a20]">
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#e6e2d9] px-3 py-1.5 rounded-sm shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#994717]" />
                Rescue insurance
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#e6e2d9] px-3 py-1.5 rounded-sm shadow-2xs">
                <Award className="w-4 h-4 text-[#152a20]" />
                Experienced guides
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#e6e2d9] px-3 py-1.5 rounded-sm shadow-2xs">
                <Footprints className="w-4 h-4 text-[#994717]" />
                Outdoor equipment provided
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Danh mục chuyến đi & Thanh lọc */}
      <section className="store-section" id="tours-catalog">
        <div className="store-container space-y-6">
          {/* Thanh phân loại và tìm kiếm */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs loại hình */}
            <div className="store-product-tabs" aria-label="Filter by experience type">
              <button
                type="button"
                aria-pressed={eventType === ""}
                onClick={() => {
                  setEventType("");
                  setPage(0);
                }}
              >
                All {totalElements > 0 ? `(${totalElements})` : ""}
              </button>
              <button
                type="button"
                aria-pressed={eventType === "TREKKING"}
                onClick={() => {
                  setEventType("TREKKING");
                  setPage(0);
                }}
              >
                Trekking
              </button>
              <button
                type="button"
                aria-pressed={eventType === "CAMPING"}
                onClick={() => {
                  setEventType("CAMPING");
                  setPage(0);
                }}
              >
                Camping
              </button>
            </div>

            {/* Thanh công cụ tìm kiếm & độ khó */}
            <form onSubmit={search} className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-[#c2c8c266] min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#74947e] shrink-0" />
                <input
                  type="text"
                  className="bg-transparent border-0 outline-none text-xs w-full text-[#02150c] placeholder:text-gray-400 font-sans"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search tours..."
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => {
                      setKeyword("");
                      setPage(0);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <select
                className="bg-white border border-[#c2c8c266] rounded px-2.5 py-1.5 text-xs font-medium text-[#152a20] cursor-pointer outline-none"
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value as DifficultyLevel | "");
                  setPage(0);
                }}
              >
                <option value="">All difficulty levels</option>
                <option value="EASY">Easy</option>
                <option value="MODERATE">Moderate</option>
                <option value="HARD">Challenging</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="store-button text-xs py-1.5 px-4 flex items-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Search"}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-[#994717] hover:underline font-semibold px-1"
                >
                  Clear filters
                </button>
              )}
            </form>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div role="alert" className="customer-notice">
              {error}
            </div>
          )}

          {/* Trạng thái tải dữ liệu */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#152a20]" />
              <p className="text-sm font-semibold text-[#424844]">
                Loading tours...
              </p>
            </div>
          ) : events.length > 0 ? (
            <>
              {/* Lưới danh sách chuyến đi - đúng 9 tour mỗi trang */}
              <div className="store-grid-three">
                {events.map((tour, index) => {
                  const cover = tour.coverImageUrl || fallbackImages[index % fallbackImages.length];
                  const difficultyText =
                    tour.difficultyLevel === "EASY"
                      ? "Easy"
                      : tour.difficultyLevel === "HARD"
                      ? "Challenging"
                      : "Moderate";

                  return (
                    <article className="store-tour-card group flex flex-col justify-between" key={tour.eventId}>
                      <Link className="store-tour-image block relative" to={`/tours/${tour.eventId}`}>
                        <img
                          src={cover}
                          alt={tour.eventName}
                          loading="lazy"
                          className="transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="store-image-tag store-orange-tag">
                          {tour.eventType === "TREKKING" ? "Trekking" : "Camping"}
                        </span>
                        <span className="store-image-tag store-image-tag-right">
                          {difficultyText}
                        </span>
                        <span className="store-image-caption">
                          <MapPin size={12} />
                          {tour.location || "Vietnamese highlands"}
                        </span>
                      </Link>

                      <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
                        <div>
                          <Link to={`/tours/${tour.eventId}`} className="hover:text-[#994717] transition-colors">
                            <h3 className="line-clamp-2 text-base font-bold text-[#02150c] font-headline min-h-[44px]">
                              {tour.eventName}
                            </h3>
                          </Link>

                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#f7f3ea] text-[#152a20] px-2 py-0.5 rounded border border-[#e6e2d9]/60">
                              <Clock3 size={11} className="text-[#994717]" />
                              Outdoors
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#f7f3ea] text-[#152a20] px-2 py-0.5 rounded border border-[#e6e2d9]/60">
                              <Users size={11} className="text-[#152a20]" />
                              Per departure
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#f7f3ea] text-emerald-800 px-2 py-0.5 rounded border border-emerald-200/60">
                              <ShieldCheck size={11} className="text-emerald-700" />
                              Rescue insurance
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#e6e2d9]/70 flex items-center justify-between">
                          <div>
                            <small className="text-[10px] text-gray-500 uppercase tracking-wider block font-mono">
                              Starting from
                            </small>
                            <strong className="text-base font-bold text-[#02150c]">
                              {vnd(tour.basePrice)}
                            </strong>
                          </div>
                          <Link
                            className="store-button text-xs py-1.5 px-3 flex items-center gap-1 shadow-2xs"
                            to={`/tours/${tour.eventId}`}
                          >
                            View details
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Thanh phân trang chuyên nghiệp - 9 tour/trang */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#e6e2d9]">
                  <p className="text-xs text-gray-500">
                    Page <b className="text-[#02150c]">{page + 1}</b> / <b>{totalPages}</b> (Total <b>{totalElements}</b> tours)
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 0}
                      onClick={() => {
                        setPage((p) => Math.max(0, p - 1));
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                      className="px-3 py-1.5 text-xs font-bold uppercase rounded border border-[#e6e2d9] bg-white text-[#152a20] hover:bg-[#f7f3ea] disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1"
                    >
                      <ChevronLeft size={14} />
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setPage(i);
                          window.scrollTo({ top: 400, behavior: "smooth" });
                        }}
                        className={`w-8 h-8 text-xs font-bold rounded flex items-center justify-center transition-colors ${
                          page === i
                            ? "bg-[#152a20] text-white"
                            : "bg-white border border-[#e6e2d9] text-[#152a20] hover:bg-[#f7f3ea]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={page >= totalPages - 1}
                      onClick={() => {
                        setPage((p) => Math.min(totalPages - 1, p + 1));
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                      className="px-3 py-1.5 text-xs font-bold uppercase rounded border border-[#e6e2d9] bg-white text-[#152a20] hover:bg-[#f7f3ea] disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1"
                    >
                      Sau
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Khi không có chuyến đi nào */
            <div className="py-14 text-center border border-dashed border-[#e6e2d9] bg-white rounded-md p-8 space-y-3">
              <Compass className="w-10 h-10 text-gray-400 mx-auto" />
              <h3 className="text-lg font-bold text-[#02150c]">No matching tours found</h3>
              <p className="text-xs text-[#424844] max-w-sm mx-auto">
                Try changing your search or clearing the filters to view all tours.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="store-button text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                View all tours
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Mục Hướng dẫn viên tinh giản */}
      <section className="store-section border-t border-[#e6e2d9] bg-[#f7f3ea]" id="guides-roster">
        <div className="store-container space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="store-eyebrow">◈ MEET OUR GUIDES</div>
              <h2 className="text-2xl font-bold text-[#02150c] font-headline">Your companions on the trail</h2>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#424844] bg-white border border-[#e6e2d9] px-3 py-1 rounded-sm">
              <ShieldCheck size={14} className="text-[#994717]" />
              Certified for outdoor safety
            </span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {guides.map((guide) => (
              <article
                key={guide.guideId}
                className="bg-white border border-[#e6e2d9] rounded-md p-3.5 flex items-start gap-3 shadow-2xs hover:border-[#152a20] transition-colors"
              >
                <div className="relative shrink-0">
                  <img
                    src={guide.avatarUrl || images.avatar}
                    alt={guide.displayName}
                    className="w-11 h-11 rounded-full object-cover border border-[#152a20]"
                  />
                  <span
                    className="absolute -bottom-1 -right-1 bg-[#152a20] text-white p-0.5 rounded-full"
                    title="Outdoor guide certification"
                  >
                    <Award size={9} />
                  </span>
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <b className="font-bold text-xs text-[#02150c] truncate block">
                    {guide.displayName}
                  </b>
                  <p className="text-[10px] font-semibold text-[#994717] truncate uppercase tracking-wider">
                    {guide.specialization || "Outdoor guiding"}
                  </p>
                  {guide.languages?.length ? (
                    <p className="text-[10px] text-[#424844] truncate">{guide.languages.join(" · ")}</p>
                  ) : null}
                  {guide.bio ? (
                    <p className="text-[10px] text-[#424844] leading-relaxed line-clamp-2">{guide.bio}</p>
                  ) : null}
                  <div className="flex items-center justify-between text-[10px] text-[#424844] pt-0.5">
                    <span>{guide.experienceYears ?? 0} years of experience</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Available
                    </span>
                  </div>
                </div>
              </article>
            ))}
            {!guides.length && (
              <p className="col-span-4 text-center text-gray-500 py-4 text-xs">
                This season guide lineup is being updated.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
