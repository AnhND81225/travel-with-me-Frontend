import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, Clock3, Compass, Images, MapPin, Mountain, RefreshCw, Users, X } from "lucide-react";
import { eventGuideApi, type EventResponse } from "../../services/eventGuideApi";
import { BookingPanel } from "../../features/schedules/BookingPanel";
import { catalogErrorMessage } from "../../utils/tourGuideValidation";
import "../../styles/tour-detail.css";

// Hiển thị thời lượng thực tế, không suy diễn số đêm từ số ngày.
function durationText(minutes?: number | null) {
  if (!minutes || minutes <= 0) return "To be announced";
  const units = [[Math.floor(minutes / 1440), "day"], [Math.floor(minutes % 1440 / 60), "hour"], [minutes % 60, "minute"]] as const;
  return units.filter(([count]) => count).map(([count, label]) => `${count} ${label}${count === 1 ? "" : "s"}`).join(" ");
}

// Dùng duy nhất ảnh trả về từ tour; dialog native giữ focus và hỗ trợ phím Escape.
function TourGallery({ photos, title }: { photos: string[]; title: string }) {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  if (!photos.length) return <div className="td-photo-empty"><Mountain size={42} strokeWidth={1} /><p>Photos of this adventure are coming soon.</p></div>;

  const preview = photos.map((src, index) => ({ src, index })).filter(photo => photo.index !== selected).slice(0, 2);
  return <>
    <div className={`td-gallery ${preview.length ? "has-preview" : ""}`}>
      <button className="td-photo td-cover" onClick={() => setOpen(true)} aria-label="Open tour photo gallery">
        <img src={photos[selected]} alt={title} fetchPriority="high" /><span className="td-photo-count"><Images size={15} strokeWidth={1.4} /> View {photos.length === 1 ? "photo" : `all ${photos.length} photos`}</span>
      </button>
      {!!preview.length && <div className="td-previews">{preview.map(photo => <button className="td-photo" key={photo.index} onClick={() => setSelected(photo.index)} aria-label={`Show tour photo ${photo.index + 1}`}><img src={photo.src} alt={`${title} — photo ${photo.index + 1}`} loading="lazy" /></button>)}</div>}
    </div>
    <dialog ref={dialog} className="td-lightbox" aria-label={`${title} photo gallery`} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      <div className="td-lightbox-heading"><span>{selected + 1} / {photos.length}</span><button autoFocus onClick={() => setOpen(false)} aria-label="Close photo gallery"><X size={22} /></button></div>
      <img className="td-lightbox-main" src={photos[selected]} alt={`${title} — photo ${selected + 1}`} />
      <div className="td-thumbnails">{photos.map((src, index) => <button key={index} onClick={() => setSelected(index)} aria-label={`View photo ${index + 1}`} aria-pressed={selected === index}><img src={src} alt="" loading="lazy" /></button>)}</div>
    </dialog>
  </>;
}

export function ExpeditionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [tour, setTour] = useState<EventResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [retry, setRetry] = useState(0);
  const hash = location.hash.slice(1);
  const tab = hash === "equipment" ? "equipment" : hash === "specifications" || hash === "specs" ? "specifications" : "itinerary";

  // Bỏ qua response cũ khi đổi route hoặc unmount; retry vẫn dùng API hiện có.
  useEffect(() => {
    let active = true;
    setTour(null);
    setError("");
    if (!id || !/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
      setError("Invalid tour ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    eventGuideApi.getEvent(Number(id)).then(data => {
      if (active) { setTour(data); setActiveDay(data.details?.itinerary?.[0]?.day ?? 1); }
    }).catch(cause => { if (active) setError(catalogErrorMessage(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);

  if (loading) return <main className="td-page"><div className="td-state" role="status"><RefreshCw className="animate-spin" strokeWidth={1.4} /><h1>Preparing your adventure</h1><p>Loading tour details and itinerary…</p></div></main>;
  if (error || !tour) return <main className="td-page"><div className="td-state" role="alert"><Compass size={36} strokeWidth={1} /><h1>We couldn't load this tour</h1><p>{error || "This adventure is currently unavailable."}</p><div><button className="td-pill" onClick={() => setRetry(value => value + 1)}>Try again</button><Link to="/tours">Explore all tours <ArrowUpRight size={16} /></Link></div></div></main>;

  const photos = Array.from(new Set([tour.coverImageUrl, ...(tour.images ?? []).map(image => image.imageUrl)].filter((src): src is string => !!src)));
  const days = tour.details?.itinerary ?? [];
  const day = days.find(item => item.day === activeDay) ?? days[0];
  const equipment = tour.details?.packingItems ?? [];
  const difficulty = tour.details?.difficultyLevel === "EASY" ? "Easy" : tour.details?.difficultyLevel === "MODERATE" ? "Moderate" : tour.details?.difficultyLevel === "HARD" ? "Hard" : "To be announced";
  const dayImages = (tour.images ?? []).filter(image => image.dayNumber === day?.day);
  const dayPhoto = dayImages[0]?.imageUrl;
  const specs = [
    { label: "Meeting point", value: tour.details?.meetingPoint || "To be announced", icon: MapPin },
    { label: "Fitness level", value: difficulty, icon: Mountain },
    { label: "Duration", value: durationText(tour.details?.durationMinutes), icon: Clock3 },
    { label: "Participation requirements", value: tour.details?.requirements || "Requirements will be shared before departure.", icon: Compass },
  ];

  return <main className="td-page">
    <div className="td-container">
      <nav className="td-breadcrumb" aria-label="Breadcrumb"><Link to="/tours"><ArrowLeft size={14} /> All tours</Link><span>/</span><span>{tour.eventType === "TREKKING" ? "Trekking" : "Camping"}</span><span>/</span><span aria-current="page">{tour.eventName}</span></nav>
      <div className="td-intro">
        <div><span className="td-eyebrow">OUTDOORS, TOGETHER · {tour.eventType}</span><h1>{tour.eventName}</h1><p className="td-description">{tour.description || "Discover the itinerary, prepare for the trail and find your next departure."}</p>{tour.location && <p className="td-location"><MapPin size={16} strokeWidth={1.4} />{tour.location}</p>}</div>
      </div>
      <TourGallery key={tour.eventId} photos={photos} title={tour.eventName} />
      <dl className="td-metrics">{[
        { icon: Clock3, value: durationText(tour.details?.durationMinutes), label: "Total duration" },
        { icon: Mountain, value: difficulty, label: "Fitness level" },
        { icon: Compass, value: tour.eventType === "TREKKING" ? "Trekking" : "Camping", label: "Experience" },
        { icon: Users, value: "By departure", label: "Availability & guide" },
      ].map(metric => <div key={metric.label}><metric.icon size={27} strokeWidth={1.2} /><div><dt>{metric.label}</dt><dd>{metric.value}</dd></div></div>)}</dl>
      <div className="td-layout">
        <article className="td-content">
          <nav className="td-tabs" aria-label="Tour information">{(["itinerary", "specifications", "equipment"] as const).map(item => <Link key={item} to={{ pathname: location.pathname, search: location.search, hash: `#${item}` }} replace preventScrollReset aria-current={tab === item ? "page" : undefined}>{item.charAt(0).toUpperCase() + item.slice(1)}</Link>)}</nav>
          <section id={tab} className="td-section" aria-label={`${tab} details`}>
            {tab === "itinerary" && <>
              {!!days.length && <div className="td-days" aria-label="Choose itinerary day">{days.map(item => <button key={item.day} className="td-pill" aria-pressed={day?.day === item.day} onClick={() => setActiveDay(item.day)}>Day {item.day}</button>)}</div>}
              <span className="td-eyebrow">THE JOURNEY</span><h2>{day?.title || "Your journey, day by day"}</h2>
              {day ? <><p className="td-copy">{day.summary}</p><div className="td-day-stats">{day.distanceKm && <span><Compass size={16} />{day.distanceKm}</span>}{day.elevation && <span><Mountain size={16} />{day.elevation}</span>}</div>
                {!!day.highlights.length && <ul className="td-highlights">{day.highlights.map((highlight, index) => <li key={index}><Check size={14} />{highlight}</li>)}</ul>}
                <div className={`td-journey ${dayPhoto ? "with-photo" : ""}`}><ol className="td-timeline" key={day.day}>{day.activities.map((activity, index) => <li key={index}><time>{activity.time}</time><div><h3>{activity.title}</h3>{activity.location && <p><MapPin size={12} />{activity.location}</p>}{activity.description && <details open={!dayPhoto}><summary>Activity details <ChevronDown size={12} /></summary><p>{activity.description}</p></details>}</div></li>)}</ol>
                  {dayPhoto && <div className="td-day-photos">{dayImages.map(image => <figure className="td-day-photo" key={image.imageId}><img src={image.imageUrl} alt={image.description || `${tour.eventName} — day ${day?.day}`} loading="lazy" /><figcaption>{image.description || `Day ${day?.day} · ${day?.title}`}</figcaption></figure>)}</div>}
                </div>{!day.activities.length && <p className="td-empty">Activities for this day will be available soon.</p>}
              </> : <p className="td-empty">We're preparing the detailed itinerary. Check back soon to explore the journey.</p>}
            </>}
            {tab === "specifications" && <><span className="td-eyebrow">KNOW BEFORE YOU GO</span><h2>Ready for the trail</h2><dl className="td-specs">{specs.map(spec => <div key={spec.label}><spec.icon size={25} strokeWidth={1.3} /><div><dt>{spec.label}</dt><dd>{spec.value}</dd></div></div>)}</dl></>}
            {tab === "equipment" && <><span className="td-eyebrow">BRING WHAT MATTERS</span><h2>Pack for the trail</h2><p className="td-copy">Your tour's packing checklist. Bring the essentials and choose the extras that work for you.</p>{equipment.length ? <div className="td-equipment">{[true, false].map(required => <div key={String(required)}><h3>{required ? "Required" : "Recommended"}</h3><ul>{equipment.filter(item => item.required === required).map((item, index) => <li key={index}><Check size={16} strokeWidth={1.4} />{item.text}</li>)}</ul>{!equipment.some(item => item.required === required) && <p className="td-empty">No items listed.</p>}</div>)}</div> : <p className="td-empty">The packing checklist will be shared soon.</p>}</>}
          </section>
          {tab === "itinerary" && <div className="td-facts"><h2>A little preparation.<br />A better adventure.</h2><div><span className="td-eyebrow">MEETING POINT</span><p>{tour.details?.meetingPoint || "To be announced"}</p><Link to={{ pathname: location.pathname, search: location.search, hash: "#specifications" }} replace preventScrollReset>View trip specifications <ArrowUpRight size={15} /></Link></div></div>}
        </article>
        <aside className="td-sidebar" aria-label="Book this tour"><div className="td-booking-shell"><BookingPanel key={tour.eventId} eventId={tour.eventId} eventName={tour.eventName} price={tour.basePrice} /></div><div className="td-guide-note"><Compass size={27} strokeWidth={1} /><div><span className="td-eyebrow">YOUR TRAIL COMPANION</span><p>Your assigned guide appears when you select a departure.</p><Link to="/tours#guides-roster">Meet our guides <ArrowUpRight size={14} /></Link></div></div></aside>
      </div>
    </div>
  </main>;
}
