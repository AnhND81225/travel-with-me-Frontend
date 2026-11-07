import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Backpack,
  CalendarDays,
  Clock3,
  Compass,
  Footprints,
  Layers,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import { getProductImage } from "../../features/equipment/productImage";
import { allProducts, catalogApi, type Product, type Branch } from "../../features/equipment/catalogApi";
import {
  storefrontAssets as images,
} from "../../data/storefront";
import { eventGuideApi, type EventResponse } from "../../services/eventGuideApi";
import { PAGE_SIZE, scheduleApi } from "../../features/schedules/api";
import type { Schedule } from "../../features/schedules/types";

const services = [
  {
    title: "Buy Gear",
    image: images.buy,
    caption: "Lifetime Hardware Guarantee",
    description:
      "Premium trail & alpine gear curated from leading international manufacturers. Every purchased piece features our local repair support, trail fitting, and authentic lifetime warranty.",
    detail: "Browse our equipment catalog",
    action: "Shop Hardware",
    to: "/shop",
    icon: ShoppingBag,
  },
  {
    title: "Rent Gear",
    image: images.rent,
    caption: "3-Stage Ozone Sanitized",
    description:
      "Flexible daily & multi-day rentals. Every tent, sleeping system, and pack is ozone-cleaned, water-tested, and rigorously inspected before collection in HCM, Da Lat, or Da Nang.",
    detail: "Zero Dirty-Gear Return Policy",
    action: "Rent Fleet",
    to: "/rent",
    icon: Clock3,
  },
  {
    title: "Join Adventures",
    image: images.hike,
    caption: "WFR Certified Wilderness Guides",
    description:
      "Certified guide-led highland treks and weekend scenic ridge camps. Complete technical sleeping and cooking gear is pre-allocated and packed for you at base camp.",
    detail: "Max 12–16 Trekkers",
    action: "Browse Itineraries",
    to: "/tours",
    icon: Footprints,
  },
];
type UpcomingAdventure = { schedule?: Schedule; event: EventResponse };

const durationLabel = (start: string, end: string) => {
  const hours = Math.max(1, Math.round((Date.parse(end) - Date.parse(start)) / 3_600_000));
  const days = Math.max(1, Math.ceil(hours / 24));
  return `${days} day${days > 1 ? "s" : ""}${days > 1 ? ` ${Math.max(1, days - 1)} night${days > 2 ? "s" : ""}` : ""}`;
};

const difficultyLabel = (level?: string | null) =>
  level === "EASY" ? "Easy" : level === "HARD" ? "Hard" : level === "MODERATE" ? "Moderate" : "View details";

const formatVnd = (amount: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
function SectionHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="store-section-heading">
      <div>
        <div className="store-eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function HomePage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState("");
  const [branchesError, setBranchesError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [retry, setRetry] = useState(0);
  const [purpose, setPurpose] = useState("rent");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("All Gear");
  const [upcomingAdventures, setUpcomingAdventures] = useState<UpcomingAdventure[]>([]);
  const [adventuresLoading, setAdventuresLoading] = useState(true);
  const [adventuresError, setAdventuresError] = useState("");

  useEffect(() => {
    let active = true;
    const loadUpcomingAdventures = async () => {
      setAdventuresLoading(true);
      setAdventuresError("");
      try {
        const [events, schedules] = await Promise.all([
          eventGuideApi.listEvents({ page: 0, size: 3 }),
          (async () => {
            const rows: Schedule[] = [];
            for (let page = 0; ; page++) {
              const batch = await scheduleApi.list({ page });
              rows.push(...batch);
              if (batch.length < PAGE_SIZE) return rows;
            }
          })(),
        ]);
        const now = Date.now();
        const upcoming = schedules.filter(item => ["OPEN", "FULL"].includes(item.status) && Date.parse(item.startDatetime) > now)
          .sort((a, b) => Date.parse(a.startDatetime) - Date.parse(b.startDatetime));
        const details = await Promise.all(events.items.map(async event => ({
          event: await eventGuideApi.getEvent(event.eventId),
          schedule: upcoming.find(item => item.eventId === event.eventId),
        })));
        if (active) setUpcomingAdventures(details);
      } catch (error) {
        if (active) setAdventuresError(error instanceof Error ? error.message : "Unable to load upcoming adventures.");
      } finally {
        if (active) setAdventuresLoading(false);
      }
    };
    void loadUpcomingAdventures();
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    let active = true;
    setProductsLoading(true); setProductsError("");
    allProducts(false).then(rows => { if (active) setProducts(rows.filter(item => item.status === "ACTIVE")); })
      .catch(error => { if (active) setProductsError(error instanceof Error ? error.message : "Unable to load equipment."); })
      .finally(() => { if (active) setProductsLoading(false); });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    let active = true;
    setBranchesError("");
    catalogApi<Branch[]>("/branches").then(rows => {
      if (!active) return;
      const available = rows.filter(item => item.status === "ACTIVE");
      setBranches(available); setBranch(previous => available.some(item => String(item.id) === previous) ? previous : String(available[0]?.id ?? ""));
    }).catch(error => { if (active) setBranchesError(error instanceof Error ? error.message : "Unable to load branches."); });
    return () => { active = false; };
  }, [retry]);
  const productCategories = [...new Set(products.map(item => item.category).filter((value): value is string => !!value))];
  const featuredProducts = products.filter(item => category === "All Gear" || item.category === category).slice(0, 4);
  function dispatch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ branch });
    if (date) params.set("start", date);
    navigate(
      `${purpose === "tour" ? "/tours" : purpose === "buy" ? "/shop" : "/rent"}?${params}`,
    );
  }
  return (
    <div className="store-home">
      <section className="store-hero" aria-labelledby="hero-title">
        <img
          className="store-hero-image"
          src={images.hero}
          alt="A winding trail through a lush green mountain valley"
          fetchPriority="high"
        />
        <div className="store-hero-shade" />
        <div className="store-container store-hero-inner">
          <div className="store-season">
            <span>● Your next adventure starts here</span>
            <span>• High Altitude Fleet Ready</span>
          </div>
          <h1 id="hero-title">
            GEAR UP
            <br />
            EXPLORE MORE
          </h1>
          <p className="store-hero-description">
            Buy field-tested gear, rent expedition-grade equipment,
            <br className="store-desktop-break" /> and join certified guide-led
            wilderness itineraries across
            <br className="store-desktop-break" /> Vietnam's highlands.
          </p>
          <div className="store-hero-actions">
            <a
              href="#popular-gear"
              className="store-button store-button-orange"
            >
              <Compass size={17} />
              Explore Gear
            </a>
            <a
              href="#upcoming-adventures"
              className="store-button store-button-glass"
            >
              <Footprints size={17} />
              Discover Adventures
            </a>
            <span>
              <ShieldCheck size={16} />
              100% Field-Inspected Hardware
            </span>
          </div>
          <form className="store-dispatch" onSubmit={dispatch}>
            <div className="store-dispatch-heading">
              <b>
                <SlidersHorizontal size={16} />
                Expedition Quick Dispatch
              </b>
              <span>Choose your pickup branch</span>
            </div>
            <div className="store-dispatch-grid">
              <label>
                Select Branch
                <span className="store-field">
                  <MapPin size={16} />
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <label>
                Purpose / Action
                <span className="store-field">
                  <Layers size={16} />
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    <option value="rent">Rent Equipment (Daily)</option>
                    <option value="buy">Buy New Gear (Retail)</option>
                    <option value="tour">Book Guided Expedition</option>
                  </select>
                </span>
              </label>
              <label htmlFor="expedition-window">
                Expedition Window
                <span className="store-field">
                  <CalendarDays size={16} />
                  <input
                    id="expedition-window"
                    type="date"
                    min={new Date().toLocaleDateString("en-CA")}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </span>
              </label>
              <button className="store-button" type="submit">
                Check Availability
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </section>
      <section className="store-section store-services">
        <div className="store-container">
          <SectionHeading
            eyebrow="Integrated Backcountry System"
            title="Our Services"
          >
          </SectionHeading>
          <div className="store-grid-three">
            {services.map((service, i) => (
              <article className="store-service-card" key={service.title}>
                <div className="store-service-image">
                  <img
                    src={service.image}
                    alt={
                      service.title === "Join Adventures"
                        ? "Guided hiking group on a sunlit ridge"
                        : service.title === "Buy Gear"
                          ? "Outdoor equipment displayed in a timber retail workshop"
                          : "Organized equipment shelves in a rental depot"
                    }
                    loading="lazy"
                  />
                  <span className="store-image-tag">Pillar 0{i + 1}</span>
                  <span className="store-image-caption">{service.caption}</span>
                </div>
                <div className="store-card-body">
                  <h3>
                    <service.icon size={22} />
                    {service.title}
                  </h3>
                  <p>{service.description}</p>
                  <div className="store-service-bottom">
                    <small>
                      <PackageCheck size={13} />
                      {service.detail}
                    </small>
                    <Link to={service.to}>
                      {service.action}
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="store-section" id="popular-gear">
        <div className="store-container">
          <SectionHeading
            eyebrow="◈ Field-Vetted Hardware"
            title="Featured Gear"
            description="Acquire brand-new or rent pristine condition equipment for upcoming weekend trails."
          >
            <div className="store-product-tabs" aria-label="Product categories">
              {["All Gear", ...productCategories].map((c) => (
                <button
                  key={c}
                  aria-pressed={c === category}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </SectionHeading>
          <div className="store-grid-four">
            {featuredProducts.map(gear => (
              <article className="store-product-card" key={gear.id}>
                <Link to={`/gear/${gear.id}`} className="store-product-image" aria-label={`View ${gear.name}`}>
                  <img src={gear.imageUrl || getProductImage(gear.category, gear.name, gear.id)} alt={gear.name} loading="lazy" decoding="async" />
                  <span className="store-image-tag">{gear.category || "Equipment"}</span>
                </Link>
                <div className="store-card-body">
                  <Link to={`/gear/${gear.id}`}><h3>{gear.name}</h3></Link>
                  <p>{gear.category || "Outdoor equipment"}</p>
                  <div className="store-price-grid">
                    {gear.salePrice !== null && <div><small>● Buy</small><strong>{formatVnd(gear.salePrice)}</strong></div>}
                    {gear.rentalPricePerDay !== null && <div><small>● Rent</small><strong>{formatVnd(gear.rentalPricePerDay)} <em>/day</em></strong></div>}
                  </div>
                  <div className="store-product-actions">
                    {gear.salePrice !== null && <Link className="store-button" to={`/gear/${gear.id}?mode=buy`}><ShoppingCart size={14} />Buy</Link>}
                    {gear.rentalPricePerDay !== null && <Link className="store-button store-button-orange" to={`/gear/${gear.id}?mode=rent`}><CalendarDays size={14} />Rent</Link>}
                  </div>
                </div>
              </article>
            ))}
            {productsLoading && <p role="status" className="col-span-full text-sm text-[#5C665F]">Loading equipment…</p>}
            {!productsLoading && productsError && <div role="alert" className="col-span-full text-sm text-[#994717]">{productsError} <button onClick={() => setRetry(value => value + 1)} className="underline">Retry</button></div>}
            {!productsLoading && !productsError && !featuredProducts.length && <p className="col-span-full text-sm text-[#5C665F]">No equipment is available in this category yet.</p>}
          </div>
        </div>
      </section>
      <section
        className="store-section store-adventures"
        id="upcoming-adventures"
      >
        <div className="store-container">
          <SectionHeading
            eyebrow="♧ Field Departures & Camps"
            title="Explore Adventures"
            description="Explore our published tours and find your next departure."
          >
            <Link to="/tours" className="store-coverage">View all tours <ArrowRight size={14} /></Link>
          </SectionHeading>
          <div className="store-grid-three">
            {upcomingAdventures.map(({ schedule, event }) => {
              const remaining = schedule ? Math.max(0, schedule.maxParticipants - schedule.currentParticipants) : 0;
              const imageUrl = event.coverImageUrl || event.images?.[0]?.imageUrl || images.hike;
              const departureDate = schedule ? new Date(schedule.startDatetime) : null;
              return (
              <article className="store-tour-card" key={event.eventId}>
                <Link
                  className="store-tour-image"
                  to={`/expeditions/${event.eventId}${schedule ? `?schedule=${schedule.id}` : ""}`}
                >
                  <img src={imageUrl} alt={event.eventName} loading="lazy" />
                  <span className="store-image-tag store-orange-tag">
                    {event.eventType === "TREKKING" ? "Trekking Tour" : "Camping Event"}
                  </span>
                  <span className="store-image-tag store-image-tag-right">
                    {difficultyLabel(event.details?.difficultyLevel || event.difficultyLevel)}
                  </span>
                  <span className="store-image-caption">
                    <MapPin size={13} />
                    {event.location || branches.find(item => item.id === schedule?.branchId)?.name || "Location to be announced"}
                  </span>
                </Link>
                <div className="store-card-body">
                  <div className="store-tour-meta">
                    <span>
                      <CalendarDays size={13} />
                      {departureDate ? departureDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric", timeZone: "Asia/Ho_Chi_Minh",
                      }) : "Schedule coming soon"}
                    </span>
                    <b>
                      <Clock3 size={13} />
                      {schedule ? durationLabel(schedule.startDatetime, schedule.endDatetime) : event.details?.durationMinutes ? `${Math.round(event.details.durationMinutes / 60)} hours` : "View itinerary"}
                    </b>
                  </div>
                  <Link to={`/expeditions/${event.eventId}${schedule ? `?schedule=${schedule.id}` : ""}`}>
                    <h3>{event.eventName}</h3>
                  </Link>
                  <p>{event.description || "A guided outdoor experience with full field support and equipment planning."}</p>
                  {schedule && <div className="store-slots">
                    <div>
                      <b>
                        {remaining === 0 ? "Fully booked" : `${remaining} spot${remaining === 1 ? "" : "s"} remaining`}
                      </b>
                      <span>
                        {schedule.currentParticipants} / {schedule.maxParticipants} booked
                      </span>
                    </div>
                    <progress
                      value={schedule.currentParticipants}
                      max={schedule.maxParticipants}
                      aria-label={`Booked places for ${event.eventName}`}
                    />
                  </div>}
                  <div className="store-tour-bottom">
                    <div>
                      <small>Per {event.eventType === "CAMPING" ? "Camper" : "Expeditionist"}</small>
                      <strong>{formatVnd(event.basePrice)}</strong>
                    </div>
                    <Link
                      className="store-button"
                      to={`/expeditions/${event.eventId}${schedule ? `?schedule=${schedule.id}` : ""}`}
                    >
                      View Adventure
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
              );
            })}
            {adventuresLoading && <p className="col-span-full text-sm text-[#5C665F]">Loading upcoming adventures…</p>}
            {!adventuresLoading && adventuresError && <p className="col-span-full text-sm text-[#994717]">{adventuresError} <button onClick={() => setRetry(value => value + 1)} className="underline">Retry</button></p>}
            {!adventuresLoading && !adventuresError && !upcomingAdventures.length && <p className="col-span-full text-sm text-[#5C665F]">No tours are published yet.</p>}
          </div>
        </div>
      </section>
      <section className="store-consult">
        <div className="store-container">
          <div>
            <span className="store-consult-icon">
              <Backpack size={24} />
            </span>
            <span>
              <h3>Planning a custom expedition or private group trek?</h3>
              <p>
                Our mountain guides can tailor itinerary route, bulk gear
                fleets, and porter logistics.
              </p>
            </span>
          </div>
          <a
            className="store-button store-button-light"
            href="tel:+842888997325"
          >
            Consult Field Guide
          </a>
        </div>
      </section>
    </div>
  );
}
