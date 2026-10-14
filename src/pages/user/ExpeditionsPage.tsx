import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToursReference } from "../../components/stitch/ToursReference";
import { ReferenceDialog } from "../../components/stitch/ReferenceDialog";
import { TourBookingDialog } from "../../components/TourBookingDialog";
import { GEAR_ITEMS, GUIDED_EXPEDITIONS } from "../../data/mockData";
import { useAppStore } from "../../store/useAppStore";
import type { GuidedExpedition } from "../../interfaces";

export function ExpeditionsPage() {
  const root = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [activity, setActivity] = useState("1");
  const [tags, setTags] = useState<string[]>([]);
  const [filtered, setFiltered] = useState(false);
  const [resultCount, setResultCount] = useState(4);
  const [booking, setBooking] = useState<GuidedExpedition | null>(null);
  const [modal, setModal] = useState("");
  const [sent, setSent] = useState(false);
  const [revision, setRevision] = useState(0);
  const setGear = useAppStore((s) => s.setSelectedGearModal);
  const bookings = useAppStore((s) => s.tourBookings);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    ["1", "2", "3"].forEach((id) => {
      const b = el.querySelector(`[data-action="${id}"]`);
      b?.classList.toggle("bg-primary-container", activity === id);
      b?.classList.toggle("text-on-primary", activity === id);
      b?.setAttribute("aria-pressed", String(activity === id));
    });
    ["4", "5", "6"].forEach((id) => {
      const b = el.querySelector(`[data-action="${id}"]`);
      b?.classList.toggle("ring-2", tags.includes(id));
      b?.classList.toggle("ring-secondary", tags.includes(id));
      b?.setAttribute("aria-pressed", String(tags.includes(id)));
    });
    const selectors = el.querySelectorAll("select");
    const region = selectors[0]?.selectedIndex || 0;
    const grade = selectors[1]?.selectedIndex || 0;
    const month = selectors[2]?.selectedIndex || 0;
    const records = [
      {
        key: "tanang",
        activity: "2",
        region: 1,
        grade: 3,
        month: 0,
        price: 2850000,
        weekend: false,
      },
      {
        key: "dalat",
        activity: "3",
        region: 3,
        grade: 1,
        month: 0,
        price: 1450000,
        weekend: true,
      },
      {
        key: "bidoup",
        activity: "2",
        region: 2,
        grade: 3,
        month: 1,
        price: 3200000,
        weekend: true,
      },
      {
        key: "chuachan",
        activity: "3",
        region: 0,
        grade: 2,
        month: 1,
        price: 1150000,
        weekend: true,
      },
    ];
    let count = 0;
    records.forEach((r) => {
      const visible =
        !filtered ||
        ((activity === "1" || r.activity === activity) &&
          (!region || r.region === region) &&
          (!grade || r.grade === grade) &&
          month === r.month &&
          (!tags.includes("4") || r.price < 3000000) &&
          (!tags.includes("5") || r.weekend));
      const node = el.querySelector<HTMLElement>(`[data-tour="${r.key}"]`);
      if (node) node.hidden = !visible;
      if (visible) count++;
    });
    setResultCount(count);
    const outfitting = el.querySelector<HTMLElement>("[data-outfitting]");
    if (outfitting)
      outfitting.hidden =
        filtered &&
        el.querySelector<HTMLElement>('[data-tour="tanang"]')?.hidden === true;
    const button = el.querySelector('[data-action="8"]');
    if (button) {
      const text = Array.from(button.childNodes).find(
        (n) => n.nodeType === Node.TEXT_NODE,
      );
      if (text)
        text.textContent = ` Filter Expeditions (${filtered ? count : 4})`;
    }
    const remaining = el.querySelector("[data-featured-slots]");
    if (remaining)
      remaining.textContent = `Only ${Math.max(0, 4 - bookings.filter((b) => b.expeditionId === "home-tanang").reduce((n, b) => n + b.climberCount, 0))} Slots Remaining`;
  }, [activity, tags, filtered, revision, bookings]);
  function click(e: React.MouseEvent) {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!b) return;
    e.preventDefault();
    const a = b.dataset.action!;
    if (["1", "2", "3"].includes(a)) {
      setActivity(a);
      return;
    }
    if (["4", "5", "6"].includes(a)) {
      setTags((t) => (t.includes(a) ? t.filter((x) => x !== a) : [...t, a]));
      return;
    }
    if (a === "7") {
      root.current
        ?.querySelectorAll("select")
        .forEach((s) => (s.selectedIndex = 0));
      setActivity("1");
      setTags([]);
      setFiltered(false);
      setRevision((v) => v + 1);
      return;
    }
    if (a === "8") {
      setFiltered(true);
      setRevision((v) => v + 1);
      return;
    }
    if (a === "9" || a === "20" || a === "21") {
      setBooking(
        GUIDED_EXPEDITIONS.find(
          (t) =>
            t.id ===
            { "9": "home-tanang", "20": "home-dalat", "21": "home-bidoup" }[a],
        ) || null,
      );
      return;
    }
    if (a === "19") {
      navigate("/shop?mode=rent");
      return;
    }
    if (Number(a) >= 11 && Number(a) <= 18) {
      const id =
        Number(a) <= 12
          ? "home-pack"
          : Number(a) <= 14
            ? "home-poles"
            : Number(a) <= 16
              ? "reference-headlamp"
              : "reference-sleeping-bag";
      const item = GEAR_ITEMS.find((g) => g.id === id);
      if (item) {
        if (Number(a) % 2 === 0) navigate(`/gear/${id}?mode=buy`);
        else setGear(item);
      }
      return;
    }
    setSent(false);
    setModal(a);
  }
  return (
    <>
      <div ref={root} className="stitch-reference" onClick={click}>
        <ToursReference />
      </div>
      {filtered && resultCount === 0 && (
        <p className="store-container p-6">
          No departures match these filters. Select Clear to see all adventures.
        </p>
      )}
      <p className="store-container py-4 text-xs text-[#737874]">
        Design preview · Reference schedules and weather are sample data. Demo
        reservations use the current local tour schedule.
      </p>
      {booking && (
        <TourBookingDialog tour={booking} onClose={() => setBooking(null)} />
      )}
      {modal && (
        <ReferenceDialog
          title={
            modal === "10"
              ? "Smart Expedition Bundle"
              : modal === "22"
                ? "Chua Chan Mountain Sunrise Camp"
                : "Private Team Expedition"
          }
          onClose={() => setModal("")}
        >
          {modal === "10" ? (
            <>
              <p>
                Pack + Poles + Headlamp + Down Bag · 3-day sample bundle ·
                850,000 VND
              </p>
              <p className="customer-notice">
                The reference bundle needs a branch availability and pricing
                service before reservation. You can inspect individual items
                through the gear rental catalog.
              </p>
              <button
                className="store-button"
                onClick={() => navigate("/shop?mode=rent")}
              >
                Explore Gear Rentals
              </button>
            </>
          ) : modal === "22" ? (
            <>
              <p>
                Dong Nai Province · Moderate · 2 Days / 1 Night · 1,150,000 VND
              </p>
              <p>
                Power line ascent to the 837m summit, a ridge tent camp and
                sunrise over the Tri An lake horizon.
              </p>
              <p className="customer-notice">
                This departure is a design reference and is not currently
                available in the demo booking catalog.
              </p>
            </>
          ) : sent ? (
            <p className="customer-notice">
              Your sample inquiry is saved in this preview. No message was sent.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <label className="block my-4">
                Group size
                <input
                  className="block border p-3 w-full mt-2"
                  type="number"
                  min="8"
                  max="40"
                  required
                  defaultValue={8}
                />
              </label>
              <label className="block my-4">
                Route and preferred dates
                <textarea
                  className="block border p-3 w-full mt-2"
                  required
                  rows={3}
                />
              </label>
              <button className="store-button" type="submit">
                Save Demo Inquiry
              </button>
            </form>
          )}
        </ReferenceDialog>
      )}
    </>
  );
}
