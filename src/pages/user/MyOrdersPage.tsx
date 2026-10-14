import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OrdersReference } from "../../components/stitch/OrdersReference";
import { ReferenceDialog } from "../../components/stitch/ReferenceDialog";
import { useAppStore } from "../../store/useAppStore";
import { GUIDED_EXPEDITIONS } from "../../data/mockData";
import { formatCurrency } from "../../utils/formatters";

export function MyOrdersPage() {
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("8");
  const [modal, setModal] = useState("");
  const [days, setDays] = useState(1);
  const [extended, setExtended] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const bookings = useAppStore((s) => s.tourBookings);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach((row, i) => {
      row.hidden =
        filter === "9"
          ? i === 2
          : filter === "10"
            ? i === 1
            : filter === "11"
              ? i !== 0
              : false;
    });
    ["8", "9", "10", "11"].forEach((id) => {
      const b = el.querySelector(`[data-action="${id}"]`);
      b?.classList.toggle("bg-surface-container-lowest", filter === id);
      b?.setAttribute("aria-pressed", String(filter === id));
    });
    if (extended) {
      const due = el.querySelector("[data-return-date]");
      if (due) due.textContent = `Oct ${21 + extended}, 2024 (17:00 PM)`;
      const countdown = el.querySelector("[data-return-countdown]");
      if (countdown)
        countdown.textContent = `Returns in ${48 + 24 * extended} Hours`;
    }
  }, [filter, extended]);
  function click(e: React.MouseEvent) {
    const button = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-action]",
    );
    if (!button) return;
    e.preventDefault();
    const a = button.dataset.action!;
    if (["8", "9", "10", "11"].includes(a)) {
      setFilter(a);
      return;
    }
    if (a === "2") {
      navigate("/custody");
      return;
    }
    if (a === "6") {
      navigate("/tours");
      return;
    }
    if (a === "14") {
      navigate("/shop");
      return;
    }
    if (a === "15") {
      window.print();
      return;
    }
    setSubmitted(false);
    setModal(a);
  }
  const titles: Record<string, string> = {
    "1": "Quick Check-In",
    "3": "Extend Custody Term",
    "4": "Report an Equipment Issue",
    "5": "Fast Drop-Off Pass",
    "7": "Expedition Guidebook & Pack Checklist",
    "12": "Order #TPO-9042",
    "13": "Receipt #TPO-8812",
    "16": "Older Expedition Records",
  };
  return (
    <>
      <div ref={root} className="stitch-reference" onClick={click}>
        <OrdersReference />
      </div>
      <div className="store-container py-4 text-xs text-[#737874]">
        Design preview · Sample member, account history and weather telemetry
        from the Stitch reference.
      </div>
      {bookings.length > 0 && (
        <section className="store-container pb-8">
          <h2 className="text-xl mb-3">Your session reservations</h2>
          {bookings.map((b) => (
            <Link
              key={b.id}
              to={`/expeditions/${b.expeditionId}`}
              className="block p-4 mb-2 bg-white border border-[#c2c8c2]"
            >
              {GUIDED_EXPEDITIONS.find((t) => t.id === b.expeditionId)?.title} ·{" "}
              {b.climberCount} participants · {formatCurrency(b.totalCost)}
              <br />
              <small>{b.id} · Demo reservation</small>
            </Link>
          ))}
        </section>
      )}
      {modal && (
        <ReferenceDialog
          title={titles[modal] || "Account information"}
          onClose={() => setModal("")}
        >
          {modal === "3" ? (
            submitted ? (
              <p className="customer-notice">
                Demo return date updated to Oct {21 + extended}, 2024. No real
                rental contract or charge was changed.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setExtended((v) => v + days);
                  setSubmitted(true);
                }}
              >
                <p>Apex 3-Season Ultralight Tent (#VN-8820-ALT)</p>
                <label className="block my-4">
                  Select additional days
                  <select
                    className="block border p-3 w-full mt-2"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        +{n} day{n > 1 ? "s" : ""} ·{" "}
                        {(160000 * n).toLocaleString("en-US")} VND
                      </option>
                    ))}
                  </select>
                </label>
                <p className="customer-notice">
                  Sample rental only. This updates the design preview for this
                  session.
                </p>
                <button className="store-button" type="submit">
                  Confirm Demo Extension
                </button>
              </form>
            )
          ) : modal === "4" ? (
            submitted ? (
              <p className="customer-notice">
                Demo issue recorded for this session. No report was sent to an
                outpost.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <label className="block my-4">
                  Describe the issue
                  <textarea
                    required
                    minLength={10}
                    className="block border w-full p-3 mt-2"
                    rows={4}
                  />
                </label>
                <button className="store-button" type="submit">
                  Save Demo Report
                </button>
              </form>
            )
          ) : modal === "5" || modal === "1" ? (
            <>
              <p>Custody item: VN-8820-ALT · Da Lat Mountain Outpost</p>
              <p className="customer-notice">
                This sample account has no issued return pass. A working
                check-in QR must be issued by the outpost service after rental
                verification.
              </p>
              <Link
                className="store-button"
                to="/custody"
                onClick={() => setModal("")}
              >
                Open Gear Locker
              </Link>
            </>
          ) : modal === "7" ? (
            <>
              <p>Ta Nang – Phan Dung 3D2N Trekking</p>
              <ul className="list-disc pl-5 my-4 space-y-2">
                <li>Meet at Da Lat Outpost at 05:45 AM.</li>
                <li>
                  Pack trekking shoes, a rain shell, headlamp and a 2.5L water
                  reservoir.
                </li>
                <li>Carry a personal daypack of 5–8kg.</li>
                <li>Attend the guide’s safety briefing before departure.</li>
              </ul>
              <Link className="store-button" to="/expeditions/home-tanang">
                View Full Itinerary
              </Link>
            </>
          ) : modal === "12" ? (
            <>
              <p>Oct 14, 2024 · Da Lat Hub</p>
              <p>
                1 × Tent (Rental)
                <br />1 × Pack (Buy)
                <br />2 × Trekking Tour
              </p>
              <strong>8,654,500 VND · Active / In Progress</strong>
              <p className="customer-notice">
                Reference fixture only; no payment has been collected.
              </p>
            </>
          ) : modal === "13" ? (
            <>
              <p>Sep 02, 2024 · Ho Chi Minh</p>
              <p>2 × Down Sleeping Bag (Rental)</p>
              <strong>480,000 VND · Completed & Inspected</strong>
              <p className="customer-notice">
                Sample record, not a tax invoice.
              </p>
            </>
          ) : (
            <p className="customer-notice">
              The supplied reference includes three visible sample records.
              Older records require the account history service.
            </p>
          )}
        </ReferenceDialog>
      )}
    </>
  );
}
