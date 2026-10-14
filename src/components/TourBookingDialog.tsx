import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, X } from "lucide-react";
import { GuidedExpedition } from "../interfaces";
import { useAppStore } from "../store/useAppStore";
import { formatCurrency, formatDate } from "../utils/formatters";
export function TourBookingDialog({
  tour,
  onClose,
}: {
  tour: GuidedExpedition;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [count, setCount] = useState(1);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [error, setError] = useState("");
  const bookings = useAppStore((s) => s.tourBookings);
  const available = Math.max(
    0,
    tour.slotsRemaining -
      bookings
        .filter((b) => b.expeditionId === tour.id)
        .reduce((total, b) => total + b.climberCount, 0),
  );
  const bookTour = useAppStore((s) => s.bookTour);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  function reserve(e: React.FormEvent) {
    e.preventDefault();
    try {
      const booking = bookTour(tour, count);
      setConfirmed(booking.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save this reservation.",
      );
    }
  }
  return (
    <dialog
      ref={ref}
      className="customer-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        className="customer-dialog-close"
        onClick={onClose}
        aria-label="Close booking"
      >
        <X size={20} />
      </button>
      {confirmed ? (
        <div className="customer-success">
          <CheckCircle2 size={44} />
          <div className="store-eyebrow">Demo reservation saved</div>
          <h2>Your next adventure is on the calendar.</h2>
          <p>{tour.title}</p>
          <b>{confirmed}</b>
          <p>
            This reservation is saved for this browser session. No payment has
            been collected.
          </p>
          <Link to="/orders" className="store-button" onClick={onClose}>
            View My Orders
          </Link>
        </div>
      ) : (
        <form onSubmit={reserve}>
          <div className="store-eyebrow">Adventure reservation · Demo</div>
          <h2>{tour.title}</h2>
          <p className="customer-muted">
            <CalendarDays size={16} />
            {formatDate(tour.nextDeparture)} · {tour.duration}
          </p>
          <img src={tour.imageUrl} alt={tour.title} />
          <label className="customer-label" htmlFor="tour-participants">
            Participants
            <select
              id="tour-participants"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {Array.from({ length: Math.min(available, 6) }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i ? "participants" : "participant"}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p role="alert" className="customer-notice">
              {error}
            </p>
          )}
          {available === 0 && (
            <p role="status" className="customer-notice">
              This departure is fully reserved in this demo session.
            </p>
          )}
          <div className="customer-booking-summary">
            <span>Guide, trail permits & camp gear</span>
            <b>Included</b>
            <span>
              {count} × {formatCurrency(tour.pricePerClimber)}
            </span>
            <strong>{formatCurrency(tour.pricePerClimber * count)}</strong>
          </div>
          <p className="customer-notice">
            Preview only. This creates a demo reservation in My Orders; it does
            not charge or contact the outpost.
          </p>
          <button
            className="store-button store-button-orange"
            type="submit"
            disabled={available < 1}
          >
            Save Demo Reservation
          </button>
        </form>
      )}
    </dialog>
  );
}
