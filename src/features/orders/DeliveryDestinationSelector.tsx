import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Building, Compass, Calendar, MapPin, AlertCircle, CheckCircle, Info, Sparkles } from "lucide-react";
import type { Branch } from "../equipment/catalogApi";
import type { DeliveryType } from "./orderApi";
import { PAGE_SIZE, participantApi, scheduleApi } from "../schedules/api";
import { eventGuideApi } from "../../services/eventGuideApi";
import { canDeliverToSchedule, deliveryParticipants, tourDeliveryDate } from "./deliveryRules";

export interface BookedTourSummary {
  participantId: number;
  scheduleId: number;
  eventId: number;
  eventName: string;
  location: string;
  startDatetime: string;
  endDatetime: string;
  branchId: number;
  branchName?: string;
  participantStatus: string;
}

interface DeliveryDestinationSelectorProps {
  deliveryType: DeliveryType;
  branchId: number | "";
  scheduleId?: number | null;
  deliveryNotes?: string;
  branches: Branch[];
  isAuthenticated: boolean;
  onDeliveryChange: (next: {
    deliveryType: DeliveryType;
    branchId: number | "";
    scheduleId?: number | null;
    deliveryLocation?: string;
    deliveryNotes?: string;
    rentalStartDate?: string;
    rentalEndDate?: string;
  }) => void;
  className?: string;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export const DeliveryDestinationSelector: React.FC<DeliveryDestinationSelectorProps> = ({
  deliveryType,
  branchId,
  scheduleId,
  deliveryNotes = "",
  branches,
  isAuthenticated,
  onDeliveryChange,
  className = "",
}) => {
  const [loadingTours, setLoadingTours] = useState(false);
  const [bookedTours, setBookedTours] = useState<BookedTourSummary[]>([]);
  const [loadError, setLoadError] = useState("");

  const branchMap = useMemo(() => {
    const map = new Map<number, Branch>();
    branches.forEach((b) => map.set(b.id, b));
    return map;
  }, [branches]);

  // Load user's booked tours when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setBookedTours([]);
      return;
    }

    let isMounted = true;
    setLoadingTours(true);
    setLoadError("");

    (async () => {
      try {
        const validParticipants = await deliveryParticipants(participantApi.mine, PAGE_SIZE);
        if (!isMounted) return;

        if (validParticipants.length === 0) {
          if (isMounted) setBookedTours([]);
          return;
        }

        // Fetch schedule & event details
        const tourList: BookedTourSummary[] = [];
        for (const p of validParticipants) {
          try {
            const sched = await scheduleApi.get(p.scheduleId);
            if (!sched || !canDeliverToSchedule(sched)) continue;
            let eventName = `Tour #${sched.eventId}`;
            let loc = "Đang cập nhật";
            try {
              const ev = await eventGuideApi.getEvent(sched.eventId);
              if (ev) {
                eventName = ev.eventName || eventName;
                loc = ev.location || loc;
              }
            } catch {
              // Ignore event detail fail, keep schedule info
            }

            tourList.push({
              participantId: p.id,
              scheduleId: sched.id,
              eventId: sched.eventId,
              eventName,
              location: loc,
              startDatetime: sched.startDatetime,
              endDatetime: sched.endDatetime,
              branchId: sched.branchId,
              participantStatus: p.participantStatus,
            });
          } catch {
            // ignore individual schedule failure
          }
        }

        if (isMounted) {
          // Sort by departure time ascending
          tourList.sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime());
          setBookedTours(tourList);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError("Không thể tải danh sách tour đã đặt");
        }
      } finally {
        if (isMounted) setLoadingTours(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const selectedTour = useMemo(() => {
    if (!scheduleId) return null;
    return bookedTours.find((t) => t.scheduleId === scheduleId) || null;
  }, [bookedTours, scheduleId]);

  const handleSelectStorePickup = () => {
    onDeliveryChange({
      deliveryType: "STORE_PICKUP",
      branchId: branchId || (branches[0]?.id ?? ""),
      scheduleId: null,
      deliveryLocation: "",
      deliveryNotes,
    });
  };

  const handleSelectTourDelivery = (chosenScheduleId?: number) => {
    const targetTour = chosenScheduleId
      ? bookedTours.find((t) => t.scheduleId === chosenScheduleId)
      : bookedTours[0];

    if (!targetTour) {
      onDeliveryChange({
        deliveryType: "TOUR_DELIVERY",
        branchId: branchId || (branches[0]?.id ?? ""),
        scheduleId: null,
        deliveryLocation: "",
        deliveryNotes,
      });
      return;
    }

    const startDate = tourDeliveryDate(targetTour.startDatetime);
    const endDate = tourDeliveryDate(targetTour.endDatetime);

    onDeliveryChange({
      deliveryType: "TOUR_DELIVERY",
      branchId: targetTour.branchId,
      scheduleId: targetTour.scheduleId,
      deliveryLocation: `${targetTour.eventName} (${formatDate(targetTour.startDatetime)}) - ${targetTour.location}`,
      deliveryNotes,
      rentalStartDate: startDate,
      rentalEndDate: endDate,
    });
  };

  const handleTourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = Number(e.target.value);
    if (!sId) return;
    handleSelectTourDelivery(sId);
  };

  return (
    <div className={`space-y-3 font-label text-xs ${className}`}>
      {/* Header & Tabs */}
      <div className="space-y-1.5">
        <label className="font-bold text-[#111D16] uppercase text-[10px] tracking-wider block flex items-center justify-between">
          <span>Phương thức nhận thiết bị *</span>
          {deliveryType === "TOUR_DELIVERY" && selectedTour && (
            <span className="text-[#059669] normal-case font-bold flex items-center gap-1 text-[10px]">
              <CheckCircle className="w-3 h-3" /> Giao tại điểm tập kết tour
            </span>
          )}
        </label>

        {/* 2 Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[#EBE6DC] p-1 rounded-xs border border-[#D8D2C5]">
          <button
            type="button"
            onClick={handleSelectStorePickup}
            className={`py-2 px-2.5 rounded-xs font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deliveryType === "STORE_PICKUP"
                ? "bg-white text-[#152A20] shadow-xs border border-[#152A20]"
                : "text-[#5C665F] hover:text-[#111D16] hover:bg-white/50"
            }`}
          >
            <Building className="w-3.5 h-3.5 shrink-0" />
            <span>Nhận tại Outpost</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTourDelivery()}
            className={`py-2 px-2.5 rounded-xs font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              deliveryType === "TOUR_DELIVERY"
                ? "bg-[#152A20] text-emerald-400 shadow-xs border border-[#152A20]"
                : "text-[#5C665F] hover:text-[#111D16] hover:bg-white/50"
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>Giao tại Tour đã đặt</span>
            {bookedTours.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#D97845] text-white text-[9px] font-bold rounded-full">
                {bookedTours.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Option 1: STORE PICKUP */}
      {deliveryType === "STORE_PICKUP" && (
        <div className="space-y-2 p-3 bg-white border border-[#D8D2C5] rounded-xs animate-in fade-in duration-200">
          <div className="space-y-1">
            <label className="font-bold text-[#5C665F] uppercase text-[10px] block">
              Chọn chi nhánh nhận hàng
            </label>
            <select
              value={branchId}
              onChange={(e) =>
                onDeliveryChange({
                  deliveryType: "STORE_PICKUP",
                  branchId: Number(e.target.value) || "",
                  scheduleId: null,
                  deliveryLocation: "",
                  deliveryNotes,
                })
              }
              required
              className="w-full py-2 px-3 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
            >
              <option value="">-- Chọn chi nhánh Outpost --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {branchId && branchMap.get(Number(branchId)) && (
            <div className="text-[11px] text-[#5C665F] flex items-start gap-1.5 pt-1 border-t border-[#EBE6DC] font-body">
              <MapPin className="w-3.5 h-3.5 text-[#152A20] shrink-0 mt-0.5" />
              <span>{branchMap.get(Number(branchId))?.address || "Địa chỉ trạm chi nhánh"}</span>
            </div>
          )}
        </div>
      )}

      {/* Option 2: TOUR DELIVERY */}
      {deliveryType === "TOUR_DELIVERY" && (
        <div className="space-y-2.5 p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xs animate-in fade-in duration-200">
          {!isAuthenticated ? (
            <div className="p-3 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs text-xs text-[#9A4D22] space-y-1 font-body">
              <p className="font-bold flex items-center gap-1.5 text-[11px]">
                <Info className="w-4 h-4 text-[#D97845]" />
                Cần đăng nhập để dùng tính năng này
              </p>
              <p className="text-[11px]">
                Vui lòng đăng nhập tài khoản đã đặt tour để hệ thống tự động nhận diện lịch khởi hành.
              </p>
            </div>
          ) : loadingTours ? (
            <div className="py-4 text-center text-xs text-[#5C665F] flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-[#152A20] border-t-transparent rounded-full animate-spin" />
              <span>Đang kiểm tra lịch trình tour của bạn...</span>
            </div>
          ) : bookedTours.length === 0 ? (
            <div className="space-y-2">
              <div className="p-3 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs text-xs text-[#9A4D22] space-y-1.5 font-body">
                <div className="font-bold text-[#D97845] flex items-center gap-1.5 uppercase text-[10px] font-label">
                  <AlertCircle className="w-4 h-4 text-[#D97845] shrink-0" />
                  Bạn chưa có tour nào sắp tới
                </div>
                <p className="text-[11px]">
                  Tính năng này dành cho khách đã đặt tour để nhận thiết bị ngay tại điểm tập kết xuất phát.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <Link
                    to="/tours"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#D97845] hover:bg-[#C66735] text-white font-bold text-[10px] uppercase rounded-xs transition"
                  >
                    <span>Khám phá Tour ngay</span>
                    <span>→</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleSelectStorePickup}
                    className="underline text-[11px] font-bold text-[#111D16] hover:text-[#D97845]"
                  >
                    Chuyển sang nhận tại Outpost
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-[#166534] uppercase text-[10px] block flex items-center justify-between">
                  <span>Chọn tour bạn tham gia:</span>
                  <span className="text-[10px] font-mono-spec font-bold text-[#15803D]">
                    {bookedTours.length} tour khả dụng
                  </span>
                </label>
                <select
                  value={scheduleId || ""}
                  onChange={handleTourChange}
                  className="w-full py-2 px-3 bg-white border border-[#86EFAC] rounded-xs text-xs text-[#111D16] font-bold focus:outline-none focus:border-[#15803D]"
                >
                  <option value="">-- Chọn lịch trình tour bạn đi --</option>
                  {bookedTours.map((t) => (
                    <option key={t.scheduleId} value={t.scheduleId}>
                      {t.eventName} · {formatDate(t.startDatetime)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTour && (
                <div className="p-3 bg-white border border-[#BBF7D0] rounded-xs text-xs space-y-2 text-[#152A20]">
                  <div className="flex items-start justify-between gap-2 border-b border-[#DCFCE7] pb-2">
                    <div>
                      <div className="text-[10px] font-bold text-[#15803D] uppercase tracking-wide">
                        ĐIỂM TẬP KẾT & BÀN GIAO ĐỒ
                      </div>
                      <div className="font-bold text-sm text-[#111D16] font-headline">
                        {selectedTour.eventName}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] font-bold text-[9px] uppercase shrink-0">
                      Tour #{selectedTour.scheduleId}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-body text-[#374151]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                      <span>
                        <strong>Khởi hành:</strong> {formatDate(selectedTour.startDatetime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                      <span>
                        <strong>Địa điểm:</strong> {selectedTour.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:col-span-2 text-[11px] text-[#166534] bg-[#F0FDF4] p-1.5 rounded-xs border border-[#DCFCE7]">
                      <Sparkles className="w-3.5 h-3.5 text-[#D97845] shrink-0" />
                      <span>
                        Chi nhánh chuẩn bị đồ: <strong>{branchMap.get(selectedTour.branchId)?.name || `Trạm #${selectedTour.branchId}`}</strong>. Hướng dẫn viên / ban điều hành đoàn sẽ mang đồ đến bàn giao trực tiếp cho bạn trước giờ khởi hành.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delivery Notes */}
          <div className="space-y-1 pt-1">
            <label className="font-bold text-[#5C665F] uppercase text-[10px] block">
              Ghi chú giao đồ cho đoàn (tùy chọn)
            </label>
            <input
              type="text"
              value={deliveryNotes}
              onChange={(e) =>
                onDeliveryChange({
                  deliveryType: "TOUR_DELIVERY",
                  branchId,
                  scheduleId,
                  deliveryLocation: selectedTour
                    ? `${selectedTour.eventName} (${formatDate(selectedTour.startDatetime)}) - ${selectedTour.location}`
                    : "",
                  deliveryNotes: e.target.value,
                })
              }
              placeholder="Ví dụ: Giao cho tôi tại xe số 2, hoặc liên hệ SĐT..."
              className="w-full py-1.5 px-2.5 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] placeholder-[#A39B8D] focus:outline-none focus:border-[#152A20]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
