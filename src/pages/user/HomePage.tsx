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
  Navigation,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import { HOME_GEAR } from "../../data/mockData";
import {
  storefrontAssets as images,
  storefrontBranches as branches,
} from "../../data/storefront";
import { useAppStore } from "../../store/useAppStore";
import { eventGuideApi, type EventResponse } from "../../services/eventGuideApi";
import { scheduleApi } from "../../features/schedules/api";
import type { Schedule } from "../../features/schedules/types";

const services = [
  {
    title: "Buy Gear",
    image: images.buy,
    caption: "Lifetime Hardware Guarantee",
    description:
      "Premium trail & alpine gear curated from leading international manufacturers. Every purchased piece features our local repair support, trail fitting, and authentic lifetime warranty.",
    detail: "350+ SKUs in Stock",
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
const productCategories = ["Packs", "Tents", "Trekking", "Kitchen"];
const productBadges = ["Dual Option", "1.45 kg", "100% Carbon", "2,800W Flame"];
type UpcomingAdventure = { schedule: Schedule; event: EventResponse; branchName?: string };

const durationLabel = (start: string, end: string) => {
  const hours = Math.max(1, Math.round((Date.parse(end) - Date.parse(start)) / 3_600_000));
  const days = Math.max(1, Math.ceil(hours / 24));
  return `${days} day${days > 1 ? "s" : ""}${days > 1 ? ` ${Math.max(1, days - 1)} night${days > 2 ? "s" : ""}` : ""}`;
};

const difficultyLabel = (level?: string | null) =>
  level === "EASY" ? "Easy" : level === "HARD" ? "Hard" : "Moderate";

const formatVnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
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
  const { outposts, setSelectedStation } = useAppStore();
  const [branch, setBranch] = useState("dalat-alpine");
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
        const [schedules, apiBranches] = await Promise.all([
          scheduleApi.list({ page: 0 }),
          scheduleApi.branches(),
        ]);
        const now = Date.now();
        const upcoming = schedules
          .filter((schedule) => ["OPEN", "FULL"].includes(schedule.status) && Date.parse(schedule.startDatetime) >= now)
          .sort((a, b) => Date.parse(a.startDatetime) - Date.parse(b.startDatetime))
          .slice(0, 3);
        const details = await Promise.all(
          upcoming.map(async (schedule) => ({
            schedule,
            event: await eventGuideApi.getEvent(schedule.eventId),
            branchName: apiBranches.find((branch) => branch.id === schedule.branchId)?.name,
          })),
        );
        if (active) setUpcomingAdventures(details);
      } catch (error) {
        if (active) setAdventuresError(error instanceof Error ? error.message : "Unable to load upcoming adventures.");
      } finally {
        if (active) setAdventuresLoading(false);
      }
    };
    void loadUpcomingAdventures();
    return () => { active = false; };
  }, []);
  function dispatch(e: React.FormEvent) {
    e.preventDefault();
    const selected = outposts.find((b) => b.id === branch);
    if (selected) setSelectedStation(selected);
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
          alt="Morning mist across the forested mountain ridges of Vietnam"
          fetchPriority="high"
        />
        <div className="store-hero-shade" />
        <div className="store-container store-hero-inner">
          <div className="store-season">
            <span>● Autumn expedition season active</span>
            <span>• High Altitude Fleet Ready</span>
          </div>
          <h1 id="hero-title">
            GEAR UP.
            <br />
            EXPLORE MORE.
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
              <span>Live stock across 3 outposts</span>
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
            <div className="store-capacity">
              <span className="store-capacity-ring">94%</span>
              <span>
                <b>Depot Capacity</b>
                <small>328 items prepped for this weekend</small>
              </span>
            </div>
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
            title="Popular Gear"
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
            {HOME_GEAR.map((gear, i) =>
              category === "All Gear" || category === productCategories[i] ? (
                <article className="store-product-card" key={gear.id}>
                  <Link to={`/gear/${gear.id}`} className="store-product-image">
                    <img src={gear.imageUrl} alt={gear.name} loading="lazy" />
                    <span className="store-image-tag">
                      {productCategories[i] === "Packs"
                        ? "Backpacks"
                        : productCategories[i]}
                    </span>
                    <span className="store-image-tag store-image-tag-right">
                      {productBadges[i]}
                    </span>
                  </Link>
                  <div className="store-card-body">
                    <Link to={`/gear/${gear.id}`}>
                      <h3>{gear.name}</h3>
                    </Link>
                    <p>{gear.description}</p>
                    <div className="store-price-grid">
                      <div>
                        <small>● Buy</small>
                        <strong>
                          {(gear.retailPrice * 25).toLocaleString("en-US")}k{" "}
                          <em>₫</em>
                        </strong>
                      </div>
                      <div>
                        <small>● Rent</small>
                        <strong>
                          {Math.round(
                            gear.dailyRentalPrice * 25,
                          ).toLocaleString("en-US")}
                          k <em>₫/day</em>
                        </strong>
                      </div>
                    </div>
                    <div className="store-stock">
                      <span>
                        • Da Lat Outpost
                        <b>{gear.stockByOutpost["dalat-alpine"]} avail</b>
                      </span>
                      <span>
                        • {i === 1 ? "Da Nang Depot" : "HCM Flagship"}
                        <b>
                          {
                            gear.stockByOutpost[
                              i === 1 ? "danang-pass" : "hcmc-flagship"
                            ]
                          }{" "}
                          avail
                        </b>
                      </span>
                    </div>
                    <div className="store-product-actions">
                      <Link
                        className="store-button"
                        to={`/gear/${gear.id}?mode=buy`}
                      >
                        <ShoppingCart size={14} />
                        Buy
                      </Link>
                      <Link
                        className="store-button store-button-orange"
                        to={`/gear/${gear.id}?mode=rent`}
                      >
                        <CalendarDays size={14} />
                        Rent
                      </Link>
                    </div>
                  </div>
                </article>
              ) : null,
            )}
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
            title="Upcoming Adventures"
            description="Guided wilderness itineraries with full high-altitude gear packages included."
          >
            <span className="store-coverage">
              <ShieldCheck size={14} />
              All departures include Search & Evacuation coverage
            </span>
          </SectionHeading>
          <div className="store-grid-three">
            {upcomingAdventures.map(({ schedule, event, branchName }) => {
              const remaining = Math.max(0, schedule.maxParticipants - schedule.currentParticipants);
              const imageUrl = event.coverImageUrl || event.images[0]?.imageUrl || images.hike;
              const departureDate = new Date(schedule.startDatetime);
              return (
              <article className="store-tour-card" key={schedule.id}>
                <Link
                  className="store-tour-image"
                  to={`/expeditions/${event.eventId}?schedule=${schedule.id}`}
                >
                  <img src={imageUrl} alt={event.eventName} loading="lazy" />
                  <span className="store-image-tag store-orange-tag">
                    {event.eventType === "TREKKING" ? "Trekking Tour" : "Camping Event"}
                  </span>
                  <span className="store-image-tag store-image-tag-right">
                    {difficultyLabel(event.details?.difficultyLevel)}
                  </span>
                  <span className="store-image-caption">
                    <MapPin size={13} />
                    {event.location || branchName || "Vietnam"}
                  </span>
                </Link>
                <div className="store-card-body">
                  <div className="store-tour-meta">
                    <span>
                      <CalendarDays size={13} />
                      {departureDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <b>
                      <Clock3 size={13} />
                      {durationLabel(schedule.startDatetime, schedule.endDatetime)}
                    </b>
                  </div>
                  <Link to={`/expeditions/${event.eventId}?schedule=${schedule.id}`}>
                    <h3>{event.eventName}</h3>
                  </Link>
                  <p>{event.description || "A guided outdoor experience with full field support and equipment planning."}</p>
                  <div className="store-slots">
                    <div>
                      <b>
                        {remaining <= 2
                          ? "Last 2 spots!"
                          : `${remaining} slots remaining`}
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
                  </div>
                  <div className="store-tour-bottom">
                    <div>
                      <small>Per {event.eventType === "CAMPING" ? "Camper" : "Expeditionist"}</small>
                      <strong>{formatVnd(event.basePrice)}</strong>
                    </div>
                    <Link
                      className="store-button"
                      to={`/expeditions/${event.eventId}?schedule=${schedule.id}`}
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
            {!adventuresLoading && adventuresError && <p className="col-span-full text-sm text-[#994717]">{adventuresError}</p>}
            {!adventuresLoading && !adventuresError && !upcomingAdventures.length && <p className="col-span-full text-sm text-[#5C665F]">No upcoming departures are available yet.</p>}
          </div>
        </div>
      </section>
      <section className="store-section store-network">
        <div className="store-container">
          <SectionHeading
            eyebrow="⌂ Custody & Inspection Depots"
            title="Physical Outpost Network"
            description="Visit our local service hubs for fitting, pre-trip briefings, sanitized gear pickup, and expedited return."
          >
            <span className="store-online">● 3 Active Hubs Online</span>
          </SectionHeading>
          <div className="store-grid-three">
            {branches.map((b, i) => (
              <article className="store-branch-card" key={b.id}>
                <div className="store-branch-meta">
                  <span className={i === 1 ? "store-orange-tag" : ""}>
                    {b.tag}
                  </span>
                  <small>● Hours: {b.hours}</small>
                </div>
                <h3>{b.name}</h3>
                <p>
                  <MapPin size={13} />
                  {b.address}
                </p>
                <a
                  className="store-map"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open map for ${b.name}`}
                >
                  <img
                    src={b.map}
                    alt={`Map preview for ${b.name}`}
                    loading="lazy"
                  />
                </a>
                <small className="store-depot-label">Depot Services:</small>
                <div className="store-branch-services">
                  {b.services.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                <div className="store-branch-bottom">
                  <span>
                    Phone:{" "}
                    <a href={`tel:${b.phone.replace(/\s/g, "")}`}>{b.phone}</a>
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get Directions
                    <Navigation size={13} />
                  </a>
                </div>
              </article>
            ))}
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
