import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  MapPin,
  ShieldCheck,
  Tent,
  Users,
} from "lucide-react";
import { GUIDED_EXPEDITIONS } from "../../data/mockData";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { TourBookingDialog } from "../../components/TourBookingDialog";
export function ExpeditionDetailPage() {
  const { id } = useParams();
  const tour = GUIDED_EXPEDITIONS.find((t) => t.id === id);
  const [booking, setBooking] = useState(false);
  if (!tour)
    return (
      <div className="store-home">
        <div className="store-container customer-tour-detail">
          <div className="customer-empty">
            <h1>Adventure not found.</h1>
            <Link className="store-button" to="/tours">
              Explore Adventures
            </Link>
          </div>
        </div>
      </div>
    );
  return (
    <div className="store-home">
      <div className="store-container customer-tour-detail">
        <Link to="/tours" className="customer-text-button">
          <ArrowLeft size={14} />
          Back to Tours & Events
        </Link>
        <header>
          <div className="store-eyebrow">Guided Wilderness Itinerary</div>
          <h1>{tour.title}</h1>
          <p>{tour.subtitle}</p>
        </header>
        <section className="customer-tour-feature">
          <div className="customer-feature-photo">
            <img src={tour.imageUrl} alt={tour.title} />
          </div>
          <div className="customer-feature-booking">
            <div className="store-eyebrow">Your Adventure at a Glance</div>
            <h3>{tour.duration}</h3>
            <div className="customer-feature-facts">
              <p>
                <CalendarDays />
                <span>
                  <small>Departure</small>
                  <b>{formatDate(tour.nextDeparture)}</b>
                  {tour.slotsRemaining} of {tour.totalSlots} places remaining
                </span>
              </p>
              <p>
                <MapPin />
                <span>
                  <small>Wilderness Region</small>
                  <b>{tour.region}</b>
                  {tour.difficulty}
                </span>
              </p>
              <p>
                <Users />
                <span>
                  <small>Lead Guide</small>
                  <b>{tour.leadGuide.name}</b>
                  {tour.leadGuide.certification}
                </span>
              </p>
              <p>
                <ShieldCheck />
                <span>
                  <small>Includes</small>
                  <b>Guide, permits and camp equipment</b>Participant count and
                  final total are shown before saving.
                </span>
              </p>
            </div>
            <div className="customer-feature-price">
              <small>Per Participant</small>
              <strong>{formatCurrency(tour.pricePerClimber)}</strong>
            </div>
            <button
              className="store-button store-button-orange"
              onClick={() => setBooking(true)}
              disabled={tour.slotsRemaining < 1}
            >
              {tour.slotsRemaining ? "Book Adventure" : "Departure Full"}
            </button>
            <p className="customer-notice">
              Reservations in this preview are demo records. No payment is
              collected.
            </p>
          </div>
        </section>
        <section className="customer-itinerary">
          <div className="customer-section-label">
            <h3>Field Route Itinerary</h3>
            <span>{tour.duration}</span>
          </div>
          <div className="store-grid-three">
            {tour.itinerary.map((day, i) => (
              <article key={day.day}>
                <span className="customer-day">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="store-eyebrow">{day.day}</div>
                <h4>{day.title}</h4>
                <p>{day.desc}</p>
                <small>
                  <Tent size={14} />
                  {day.campElevation}
                </small>
              </article>
            ))}
          </div>
          <div className="customer-inclusions">
            <div>
              <h4>
                <ShieldCheck size={18} />
                What to Expect
              </h4>
              {[
                "Pre-departure gear check and safety briefing",
                "Guided route and communal camp equipment",
                "Trail meals and local logistics",
              ].map((s) => (
                <p key={s}>
                  <Check size={14} />
                  {s}
                </p>
              ))}
            </div>
            <div>
              <h4>
                <Tent size={18} />
                Prepare for the Trail
              </h4>
              <p>
                Bring comfortable trail shoes, a personal daypack, water
                bottles, and clothing suitable for changing weather.
              </p>
              <Link className="customer-text-button" to="/rent">
                Explore Rental Gear
              </Link>
            </div>
          </div>
        </section>
      </div>
      {booking && (
        <TourBookingDialog tour={tour} onClose={() => setBooking(false)} />
      )}
    </div>
  );
}
