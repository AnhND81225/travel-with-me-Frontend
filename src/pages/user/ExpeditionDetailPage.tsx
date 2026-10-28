import { useEffect, useState, type KeyboardEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Backpack, CalendarDays, Check, ChevronDown, Clock3, Compass, Footprints, MapPin, Mountain, RefreshCw, Tent, Users } from "lucide-react";
import { eventGuideApi, type EventResponse, type PackingItem } from "../../services/eventGuideApi";
import { BookingPanel } from "../../features/schedules/BookingPanel";
import "./tour-detail.css";

const tabs = [
  { id: "itinerary", label: "Itinerary", icon: Footprints },
  { id: "specifications", label: "Specifications", icon: Compass },
  { id: "equipment", label: "Equipment", icon: Backpack },
] as const;
type DetailTab = typeof tabs[number]["id"];

// Hiển thị thời lượng thật từ API, không suy diễn số đêm hay lịch trình.
function formatDuration(minutes?: number | null) {
  if (!minutes || minutes <= 0) return "Chưa cập nhật";
  return [Math.floor(minutes / 1440) ? `${Math.floor(minutes / 1440)} ngày` : "", Math.floor(minutes % 1440 / 60) ? `${Math.floor(minutes % 1440 / 60)} giờ` : "", minutes % 60 ? `${minutes % 60} phút` : ""].filter(Boolean).join(" ");
}

// Dùng cùng một cách trình bày cho trang bị bắt buộc và trang bị khuyến nghị.
function EquipmentList({ title, items, required }: { title: string; items: PackingItem[]; required: boolean }) {
  return <section className="tour-equipment-group">
    <div className="tour-section-heading"><h3>{title}</h3><span>{items.length} món</span></div>
    {items.length ? <ul>{items.map((item, index) => <li key={`${index}-${item.text}`}><span className={required ? "tour-check required" : "tour-check"}><Check size={14} aria-hidden="true" /></span>{item.text}</li>)}</ul>
      : <p className="tour-muted">Chưa có trang bị {required ? "bắt buộc" : "khuyến nghị"} được liệt kê.</p>}
  </section>;
}

// Giữ nguyên route tour, query lịch khởi hành và nguồn dữ liệu từ backend.
export function ExpeditionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation(), navigate = useNavigate();
  const [tour, setTour] = useState<EventResponse | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [activeDay, setActiveDay] = useState(1);
  const hash = location.hash.slice(1);
  const activeTab: DetailTab = hash === "specs" ? "specifications" : tabs.find(tab => tab.id === hash)?.id ?? "itinerary";

  useEffect(() => {
    let active = true;
    setTour(null); setError(""); setLoading(true);
    if (!id || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
      setError("Mã chuyến đi không hợp lệ."); setLoading(false);
      return;
    }
    eventGuideApi.getEvent(Number(id)).then(data => {
      if (!active) return;
      setTour(data); setSelectedImageIndex(0); setImageFailed(false); setActiveDay(data.details?.itinerary?.[0]?.day ?? 1);
    }).catch(() => {
      if (active) setError("Chưa thể tải chuyến đi này. Vui lòng thử lại hoặc khám phá các chuyến đi khác.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, revision]);

  // Đổi tab bằng hash để liên kết trực tiếp vẫn hoạt động và giữ query ?schedule.
  function selectTab(tab: DetailTab) {
    navigate({ pathname: location.pathname, search: location.search, hash: `#${tab}` }, { replace: true });
  }

  // Hỗ trợ điều hướng tab bằng bàn phím theo chuẩn ARIA.
  function tabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectTab(tabs[next].id);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  if (loading) return <div className="store-home tour-detail" aria-busy="true" aria-label="Đang tải chuyến đi">
    <div className="tour-container tour-loading" role="status"><span className="sr-only">Đang tải thông tin chuyến đi…</span><div className="tour-skeleton tour-skeleton-title" /><div className="tour-skeleton tour-skeleton-subtitle" /><div className="tour-skeleton tour-skeleton-cover" /></div>
  </div>;

  if (error || !tour) return <div className="store-home tour-detail"><div className="tour-page-state" role="alert">
    <Mountain size={40} aria-hidden="true" /><p className="tour-eyebrow">TerraPeak Outpost</p><h1>Hành trình đang chờ phía trước</h1><p>{error || "Chuyến đi này hiện chưa được công bố."}</p>
    <div className="tour-state-actions"><button className="tour-button" onClick={() => setRevision(value => value + 1)}><RefreshCw size={16} />Thử lại</button><Link to="/tours">Khám phá chuyến đi khác <ArrowUpRight size={16} /></Link></div>
  </div></div>;

  const allImages = tour.images?.length ? tour.images : tour.coverImageUrl ? [{ imageId: 0, imageUrl: tour.coverImageUrl, description: tour.eventName }] : [];
  const activeImage = allImages[selectedImageIndex] ?? allImages[0];
  const days = tour.details?.itinerary ?? [];
  const currentDay = days.find(day => day.day === activeDay) ?? days[0];
  const packing = tour.details?.packingItems ?? [];
  const difficulty = tour.details?.difficultyLevel ? { EASY: "Nhẹ nhàng", MODERATE: "Trung bình", HARD: "Thử thách" }[tour.details.difficultyLevel] : "Chưa cập nhật";
  const experience = tour.eventType === "TREKKING" ? "Trekking" : "Camping";

  return <div className="store-home tour-detail">
    <div className="tour-container">
      <nav className="tour-breadcrumb" aria-label="Đường dẫn"><Link to="/tours"><ArrowLeft size={15} aria-hidden="true" />Tất cả chuyến đi</Link><span aria-hidden="true">/</span><span>{tour.eventName}</span></nav>
      <header className="tour-hero">
        <div className="tour-hero-heading"><div><p className="tour-eyebrow"><span /> TerraPeak adventures · {experience}</p><h1>{tour.eventName}</h1></div><p className="tour-location"><MapPin size={17} aria-hidden="true" />{tour.location || "Điểm đến đang cập nhật"}</p></div>
        <div className="tour-cover">
          {activeImage && !imageFailed ? <img src={activeImage.imageUrl} alt={activeImage.description || tour.eventName} fetchPriority="high" onError={() => setImageFailed(true)} />
            : <div className="tour-image-empty"><Mountain size={52} aria-hidden="true" /><span>Hình ảnh chuyến đi đang được cập nhật</span></div>}
          <span className="tour-cover-label"><Mountain size={15} aria-hidden="true" />{experience} · {difficulty}</span>
          {allImages.length > 1 && <span className="tour-image-count">{selectedImageIndex + 1} / {allImages.length}</span>}
        </div>
        {allImages.length > 1 && <div className="tour-gallery" aria-label="Ảnh chuyến đi">{allImages.map((image, index) => <button key={image.imageId} type="button" aria-label={`Xem ảnh ${index + 1}`} aria-pressed={selectedImageIndex === index} onClick={() => { setSelectedImageIndex(index); setImageFailed(false); }}><img src={image.imageUrl} alt={image.description || `${tour.eventName} — ảnh ${index + 1}`} loading="lazy" /></button>)}</div>}
        <div className="tour-hero-bottom"><p className="tour-intro">{tour.description || "Nội dung giới thiệu chuyến đi đang được cập nhật."}</p><dl className="tour-metrics">
          <div><dt><Clock3 size={17} aria-hidden="true" />Thời lượng</dt><dd>{formatDuration(tour.details?.durationMinutes)}</dd></div>
          <div><dt><Mountain size={17} aria-hidden="true" />Độ khó</dt><dd>{difficulty}</dd></div>
          <div><dt><Tent size={17} aria-hidden="true" />Trải nghiệm</dt><dd>{experience}</dd></div>
        </dl></div>
      </header>

      <div className="tour-detail-grid">
        <article className="tour-content">
          <div className="tour-tabs" role="tablist" aria-label="Chi tiết chuyến đi">{tabs.map((tab, index) => <button key={tab.id} id={`tab-${tab.id}`} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={tab.id} tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => selectTab(tab.id)} onKeyDown={event => tabKey(event, index)}><tab.icon size={17} aria-hidden="true" />{tab.label}</button>)}</div>
          <section className="tour-tab-content" id={activeTab} role="tabpanel" aria-labelledby={`tab-${activeTab}`} tabIndex={0}>
            {activeTab === "itinerary" && <>
              <div className="tour-section-heading tour-itinerary-heading">
                <div><p className="tour-eyebrow">Từng bước, một hành trình</p><h2>Lịch trình khám phá</h2></div>
                {days.length > 0 && <span>{days.length} ngày trong lịch trình</span>}
              </div>
              {days.length > 0 && <nav className="tour-day-pagination" aria-label="Chọn ngày trong lịch trình">
                {days.map(day => <button key={day.day} type="button" aria-pressed={currentDay?.day === day.day} aria-controls="tour-day-content" onClick={() => setActiveDay(day.day)}>
                  <strong>Ngày {day.day}</strong><span>{day.title}</span>
                </button>)}
              </nav>}
              {currentDay ? <div key={currentDay.day} id="tour-day-content">
                <header className="tour-day-heading"><span className="tour-day-number">{String(currentDay.day).padStart(2, "0")}</span><div><h3>{currentDay.title}</h3>{currentDay.summary && <p>{currentDay.summary}</p>}</div></header>
                {(currentDay.distanceKm || currentDay.elevation) && <div className="tour-day-metrics">{currentDay.distanceKm && <span><Footprints size={15} aria-hidden="true" />{currentDay.distanceKm}</span>}{currentDay.elevation && <span><Mountain size={15} aria-hidden="true" />{currentDay.elevation}</span>}</div>}
                {currentDay.highlights.length > 0 && <ul className="tour-highlights" aria-label="Điểm nổi bật">{currentDay.highlights.map((highlight, index) => <li key={index}><Check size={13} aria-hidden="true" />{highlight}</li>)}</ul>}
                {currentDay.activities.length ? <ol className="tour-activity-timeline">{currentDay.activities.map((activity, index) => <li key={index}>
                  <span className="tour-activity-time">{activity.time}</span><span className="tour-timeline-dot" aria-hidden="true" />
                  <div className="tour-activity">
                    <div><h4>{activity.title}</h4>{activity.location && <p className="tour-activity-location"><MapPin size={13} aria-hidden="true" />{activity.location}</p>}</div>
                    {activity.description && <details open><summary>Chi tiết hoạt động <ChevronDown size={13} aria-hidden="true" /></summary><p>{activity.description}</p></details>}
                  </div>
                </li>)}</ol> : <p className="tour-empty-copy">Hoạt động trong ngày đang được cập nhật. Bạn có thể xem thông tin chung và trang bị trước chuyến đi.</p>}
              </div> : <div className="tour-content-empty"><CalendarDays size={30} aria-hidden="true" /><h3>Lịch trình chi tiết sắp được cập nhật</h3><p>Trong lúc chờ, hãy xem thông tin chuyến đi và danh mục trang bị cần chuẩn bị.</p><button className="tour-text-button" onClick={() => selectTab("specifications")}>Xem thông tin chuyến đi <ArrowUpRight size={15} /></button></div>}
            </>}
            {activeTab === "specifications" && <><p className="tour-eyebrow">Trước khi lên đường</p><h2>Thông tin chuyến đi</h2><p className="tour-section-intro">Những điều cần biết để chuẩn bị cho hành trình của bạn.</p><dl className="tour-specifications">
              <div><dt>Điểm đến</dt><dd>{tour.location || "Đang cập nhật"}</dd></div><div><dt>Thời lượng</dt><dd>{formatDuration(tour.details?.durationMinutes)}</dd></div><div><dt>Loại trải nghiệm</dt><dd>{experience}</dd></div><div><dt>Độ khó</dt><dd>{difficulty}</dd></div><div><dt>Điểm tập trung</dt><dd>{tour.details?.meetingPoint || "Điểm tập trung sẽ được cập nhật trước chuyến đi."}</dd></div><div><dt>Yêu cầu tham gia</dt><dd>{tour.details?.requirements || "Yêu cầu tham gia đang được cập nhật."}</dd></div><div><dt>Quy mô & hướng dẫn viên</dt><dd>Thông tin theo từng lịch khởi hành. Chọn lịch để xem số chỗ và hướng dẫn viên.</dd></div>
            </dl></>}
            {activeTab === "equipment" && <><p className="tour-eyebrow">Mang đủ, đi nhẹ</p><h2>Chuẩn bị hành trang</h2><p className="tour-section-intro">Danh mục do đội ngũ hướng dẫn chuẩn bị riêng cho chuyến đi này.</p>{packing.length ? <div className="tour-equipment"><EquipmentList title="Trang bị bắt buộc" items={packing.filter(item => item.required)} required /><EquipmentList title="Nên mang theo" items={packing.filter(item => !item.required)} required={false} /></div> : <div className="tour-content-empty"><Backpack size={30} aria-hidden="true" /><h3>Danh mục trang bị đang được chuẩn bị</h3><p>Hãy kiểm tra lại trước ngày khởi hành để chuẩn bị đúng trang bị cho chuyến đi.</p></div>}<Link className="tour-equipment-link" to="/shop">Khám phá trang bị TerraPeak <ArrowUpRight size={17} /></Link></>}
          </section>
        </article>
        <aside className="tour-booking-sidebar" aria-label="Đặt chỗ chuyến đi"><BookingPanel key={tour.eventId} eventId={tour.eventId} eventName={tour.eventName} price={tour.basePrice} /><div className="tour-booking-footnote"><Users size={17} aria-hidden="true" /><p>Mỗi tài khoản đặt một chỗ trong mỗi lịch khởi hành. Xem lại lịch và thông tin trước khi xác nhận.</p></div></aside>
      </div>
    </div>
  </div>;
}
